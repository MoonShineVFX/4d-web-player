// TODO: mp4FrameDecoder and  jpegFrameDecoder conversion

// @ts-ignore
import * as MP4Box from 'mp4box/dist/mp4box.all';

import CONFIG from '../config';

import { getAvccData } from './mp4FrameDecoderUtility';
import {TextureOnNextCallback, OnLoadingCallback} from './defines';


export class Mp4FrameDecoder {
  // private videoDecoder: VideoDecoder;
  // private mp4box: MP4Box;
  // private videoChunkList: EncodedVideoChunk[];
  // private videoFrameList: VideoFrame[];
  // private currentChunkIndex: number;
  // private currentFrameIndex: number;
  //
  // private isPreloading: boolean;
  // private isReady: boolean;
  // private isWaitingForVideoFrame: boolean;
  //
  // private readonly onLoading: OnLoadingCallback;
  // private readonly onNext: TextureOnNextCallback;
  //
  // frameCount: number;
  //
  // constructor(
  //   onNext: TextureOnNextCallback,
  //   onLoading: OnLoadingCallback | null
  // ) {
  //   this.videoDecoder = new VideoDecoder({
  //     output: arg => this.onFrameDecoded(arg),
  //     error: arg => this.onError(arg)
  //   });
  //   this.mp4box = null;
  //   this.frameCount = 0;
  //
  //   this.videoChunkList = [];
  //   this.videoFrameList = [];
  //
  //   this.currentChunkIndex = 0;
  //   this.currentFrameIndex = 0;
  //
  //   this.isPreloading = false;
  //   this.isReady = false;
  //   this.isWaitingForVideoFrame = false;
  //
  //   this.onLoading = onLoading;
  //   this.onNext = onNext;
  //   this.onReady = null;
  //
  //   this.loadResolve = null;
  //   this.loadReject = null;
  // }
  //
  // loadArrayBufferFromURL(url) {
  //   const self = this;
  //   const promise = new Promise((resolve, reject) => {
  //     self.mp4box = MP4Box.createFile();
  //     self.mp4box.onSamples = (...args) => this.onMp4boxSamples(...args);
  //     self.mp4box.onReady = arg => this.onMp4boxReady(arg);
  //     self.mp4box.onError = arg => this.onError(arg);
  //
  //     self.loadResolve = resolve;
  //     self.loadReject = reject;
  //   });
  //
  //   fetchWithProgress(url, null, this.onLoading).then(arrayBuffer => {
  //     arrayBuffer.fileStart = 0;
  //     self.mp4box.appendBuffer(arrayBuffer)
  //   });
  //
  //   return promise;
  // }
  //
  // preLoad() {
  //   console.debug('Preloading...');
  //   this.isPreloading = true;
  //   for (let i = 0; i < CONFIG.decoder.mp4PreloadFrameCount; i++) {
  //     this.videoDecoder.decode(this.videoChunkList[this.currentChunkIndex]);
  //     this.currentChunkIndex = (this.currentChunkIndex + 1) % this.sampleCount;
  //   }
  //   console.debug('Preloaded to: ', this.currentChunkIndex);
  //   this.isPreloading = false;
  // }
  //
  // onMp4boxSamples(track_id, _, samples) {
  //   for (const sample of samples) {
  //     const type = sample.is_sync ? "key" : "delta";
  //     const chunk = new EncodedVideoChunk({
  //       type: type,
  //       timestamp: sample.cts,
  //       duration: sample.duration,
  //       data: sample.data
  //     });
  //
  //     this.videoChunkList.push(chunk);
  //
  //     if (sample.number === this.sampleCount - 1) {
  //       this.mp4box.flush();
  //       this.mp4box = null;
  //
  //       this.preLoad();
  //     }
  //   }
  // }
  //
  // onMp4boxReady(mp4Info) {
  //   const track = mp4Info.videoTracks[0];
  //
  //   this.sampleCount = track.nb_samples;
  //
  //   const AvccBox = this.mp4box.moov.traks[0].mdia.minf.stbl.stsd.entries[0].avcC;
  //   this.videoDecoder.configure({
  //     codec: track.codec,
  //     codedHeight: track.track_height,
  //     codedWidth: track.track_width,
  //     description: getAvccData(AvccBox)
  //   });
  //
  //   this.mp4box.setExtractionOptions(track.id, null, {nbSamples: 1000});
  //   this.mp4box.start();
  // }
  //
  // onError(error) {
  //   console.error(error);
  //   this.loadReject(error);
  // }
  //
  // onFrameDecoded(frame) {
  //   // console.debug('Decode frame: ', this.currentDecodedFrameNumber);
  //   frame.number = this.currentFrameIndex;
  //
  //   this.videoFrameList.push(frame);
  //
  //   // Check is ready
  //   if (!this.isReady) {
  //     this.isReady = true;
  //     console.log('Ready.');
  //     this.loadResolve('Ready');
  //     if (this.onReady) this.onReady();
  //   }
  //
  //   this.currentFrameIndex = (this.currentFrameIndex + 1) % this.sampleCount;
  //
  //   if (this.isWaitingForVideoFrame) {
  //     this.isWaitingForVideoFrame = false;
  //     this.nextFrame();
  //   }
  // }
  //
  // checkNextFrameAvailability() {
  //   return this.videoFrameList.length !== 0;
  // }
  //
  // nextFrame() {
  //   if (!this.isReady) {
  //     console.error('Not ready!');
  //     return;
  //   }
  //   const frame = this.videoFrameList.shift();
  //   if (!frame) {
  //     console.warn('videoFrameList is empty, wait.');
  //     this.isWaitingForVideoFrame = true;
  //     return;
  //   }
  //
  //   // Check preload buffer
  //   if (!this.isPreloading) {
  //     let currentChunkNumber = this.currentChunkIndex;
  //     if (currentChunkNumber < frame.number) currentChunkNumber += this.sampleCount;
  //     if (currentChunkNumber - frame.number < CONFIG.decoder.mp4PreloadFrameCount / 2) {
  //       setTimeout(() => this.preLoad(), 0);
  //     }
  //   }
  //
  //   console.debug('Mp4 frame: ', frame.number);
  //   if (this.onNext) this.onNext(frame);
  //
  //   frame.close();
  // }
}
