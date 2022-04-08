PRELOAD_COUNT = 60;
PRELOAD_THRESHOLD = PRELOAD_COUNT / 2;


class Mp4FrameExtractor {
  constructor() {
    this.decoder = new VideoDecoder({
      output: arg => this.onFrameDecoded(arg),
      error: arg => this.onError(arg)
    });
    this.mp4box = null;
    this.sampleCount = null;

    this.videoChunkList = [];
    this.videoFrameList = [];

    this.currentChunkNumber = 0;
    this.currentDecodedFrameNumber = 0;

    this.isPreloading = false;
    this.isReady = false;
    this.isWaitingForVideoFrame = false;

    this.onReady = null;
    this.onNext = null;
  }

  async loadArrayBuffer(arrayBuffer) {
    this.mp4box = MP4Box.createFile();
    this.mp4box.onSamples = (...args) => this.onMp4boxSamples(...args);
    this.mp4box.onReady = arg => this.onMp4boxReady(arg);
    this.mp4box.onError = arg => this.onError(arg);

    arrayBuffer.fileStart = 0;
    this.mp4box.appendBuffer(arrayBuffer);
  }

  preLoad() {
    console.debug('Preloading...');
    this.isPreloading = true;
    for (let i = 0; i < PRELOAD_COUNT; i++) {
      this.decoder.decode(this.videoChunkList[this.currentChunkNumber]);
      this.currentChunkNumber = (this.currentChunkNumber + 1) % this.sampleCount;
    }
    console.debug('Preloaded to: ', this.currentChunkNumber);
    this.isPreloading = false;
  }

  onMp4boxSamples(track_id, _, samples) {
    for (const sample of samples) {
      const type = sample.is_sync ? "key" : "delta";
      const chunk = new EncodedVideoChunk({
        type: type,
        timestamp: sample.cts,
        duration: sample.duration,
        data: sample.data
      });

      this.videoChunkList.push(chunk);

      if (sample.number === this.sampleCount - 1) {
        this.mp4box.flush();
        this.mp4box = null;

        this.preLoad();
      }
    }
  }

  onMp4boxReady(mp4Info) {
    const track = mp4Info.videoTracks[0];

    this.sampleCount = track.nb_samples;

    const AvccBox = this.mp4box.moov.traks[0].mdia.minf.stbl.stsd.entries[0].avcC;
    this.decoder.configure({
      codec: track.codec,
      codedHeight: track.track_height,
      codedWidth: track.track_width,
      description: getExtradata(AvccBox)
    });

    this.mp4box.setExtractionOptions(track.id, null, {nbSamples: 1000});
    this.mp4box.start();
  }

  onError(error) {
    console.error(error);
  }

  onFrameDecoded(frame) {
    // console.debug('Decode frame: ', this.currentDecodedFrameNumber);
    frame.number = this.currentDecodedFrameNumber;

    this.videoFrameList.push(frame);

    // Check is ready
    if (!this.isReady) {
      this.isReady = true;
      console.log('Ready.');
      if (this.onReady) this.onReady();
    }

    this.currentDecodedFrameNumber = (this.currentDecodedFrameNumber + 1) % this.sampleCount;

    if (this.isWaitingForVideoFrame) {
      this.isWaitingForVideoFrame = false;
      this.nextFrame();
    }
  }

  checkNextFrameAvailability() {
    return this.videoFrameList.length !== 0;
  }

  nextFrame() {
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
      let currentChunkNumber = this.currentChunkNumber;
      if (currentChunkNumber < frame.number) currentChunkNumber += this.sampleCount;
      if (currentChunkNumber - frame.number < PRELOAD_THRESHOLD) {
        setTimeout(() => this.preLoad(), 0);
      }
    }

    console.debug('Mp4 frame: ', frame.number);
    if (this.onNext) this.onNext(frame);

    frame.close();
  }
}
