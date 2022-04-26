// @ts-ignore
import * as MP4Box from 'mp4box/dist/mp4box.all';

import CONFIG from '../config';

import { getAvccData } from './mp4FrameDecoderUtility';
import { TextureFrameDecoder, TextureOnNextCallback, OnLoadingCallback } from './defines';
import { fetchWithProgress } from '../utility';


type Mp4VideoFrame = VideoFrame & {number: number};


export class Mp4FrameDecoder extends TextureFrameDecoder {
  private videoDecoder: VideoDecoder;
  private mp4box: MP4Box;
  private readonly videoChunkList: EncodedVideoChunk[];
  private videoFrameList: Mp4VideoFrame[];
  private currentChunkIndex: number;
  private currentFrameIndex: number;

  private isPreloading: boolean;
  private isReady: boolean;
  private isWaitingForVideoFrame: boolean;

  constructor(
    onNext: TextureOnNextCallback,
    onLoading: OnLoadingCallback | null
  ) {
    super();
    this.videoDecoder = new VideoDecoder({
      output: (frame: VideoFrame) => this.onFrameDecoded(frame),
      error: (error: DOMException) => this.onError(error)
    });
    this.mp4box = null;
    this.frameCount = 0;

    this.videoChunkList = [];
    this.videoFrameList = [];

    this.currentChunkIndex = 0;
    this.currentFrameIndex = 0;

    this.isPreloading = false;
    this.isWaitingForVideoFrame = false;

    this.isReady = false;

    this.openResolve = null;
    this.openReject = null;

    this.onNext = onNext;
    this.onLoading = onLoading;
  }

  open(source: string): Promise<string>;
  open(source: any): Promise<string> {
    const isValidSource = typeof source === 'string';

    const self = this;

    const promise = new Promise<string>((resolve, reject) => {
      if (!isValidSource) {
        reject('Invalid source');
        return;
      }

      self.mp4box = MP4Box.createFile();
      self.mp4box.onSamples = (...args: [track_id: number, user: string, samples: MP4Box.Sample[]]) => this.onMp4boxSamples(...args);
      self.mp4box.onReady = (arg: any) => this.onMp4boxReady(arg);
      self.mp4box.onError = (arg: any) => this.onError(arg);

      self.openResolve = resolve;
      self.openReject = reject;
    });

    if (isValidSource) {
      fetchWithProgress(source, null, this.onLoading).then(arrayBuffer => {
        (arrayBuffer as MP4Box.MP4ArrayBuffer).fileStart = 0;
        self.mp4box.appendBuffer(arrayBuffer)
      });
    }

    return promise;
  }

  preLoad() {
    console.debug('Preloading...');
    this.isPreloading = true;
    for (let i = 0; i < CONFIG.decoder.mp4PreloadFrameCount; i++) {
      this.videoDecoder.decode(this.videoChunkList[this.currentChunkIndex]);
      this.currentChunkIndex = (this.currentChunkIndex + 1) % this.frameCount;
    }
    console.debug('Preloaded to: ', this.currentChunkIndex);
    this.isPreloading = false;
  }

  onMp4boxSamples(track_id: number, user: string, samples: MP4Box.Sample[]) {
    for (const sample of samples) {
      const type = sample.is_sync ? "key" : "delta";
      const chunk = new EncodedVideoChunk({
        type: type,
        timestamp: sample.cts,
        duration: sample.duration,
        data: sample.data
      });

      this.videoChunkList.push(chunk);

      if (sample.number === this.frameCount - 1) {
        this.mp4box.flush();
        this.mp4box = null;

        this.preLoad();
      }
    }
  }

  onMp4boxReady(mp4Info: MP4Box.MP4Info) {
    const track = mp4Info.videoTracks[0];

    this.frameCount = track.nb_samples;

    const AvccBox = this.mp4box.moov.traks[0].mdia.minf.stbl.stsd.entries[0].avcC;
    this.videoDecoder.configure({
      codec: track.codec,
      codedHeight: track.track_height,
      codedWidth: track.track_width,
      description: getAvccData(AvccBox)
    });

    this.mp4box.setExtractionOptions(track.id, null, {nbSamples: 1000});
    this.mp4box.start();
  }

  onError(error: DOMException) {
    console.error(error);
    this.openReject(error.message);
  }

  onFrameDecoded(frame: VideoFrame) {
    const mp4Frame = <Mp4VideoFrame>frame;
    mp4Frame.number = this.currentFrameIndex;

    this.videoFrameList.push(mp4Frame);

    // Check is ready
    if (!this.isReady) {
      this.isReady = true;
      console.log('Ready.');
      this.openResolve('Ready');
    }

    this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frameCount;

    if (this.isWaitingForVideoFrame) {
      this.isWaitingForVideoFrame = false;
      this.playNextFrame();
    }
  }

  isNextFrameAvailable() {
    return this.videoFrameList.length !== 0 || this.isWaitingForVideoFrame;
  }

  playNextFrame() {
    if (!this.isReady) {
      console.error('Not ready!');
      return;
    }
    const frame = this.videoFrameList.shift();
    if (!frame) {
      console.warn('videoFrameList is empty, wait.');
      this.isWaitingForVideoFrame = true;
      return;
    }

    // Check preload buffer
    if (!this.isPreloading) {
      let currentChunkNumber = this.currentChunkIndex;
      if (currentChunkNumber < frame.number) currentChunkNumber += this.frameCount;
      if (currentChunkNumber - frame.number < CONFIG.decoder.mp4PreloadFrameCount / 2) {
        setTimeout(() => this.preLoad(), 0);
      }
    }

    console.debug('Mp4 frame: ', frame.number);
    if (this.onNext) this.onNext(frame);

    frame.close();
  }
}
