import CONFIG from './Config';


type FrameDecodedCallback = (frameNumber: number, totalFrameCount: number, videoDom: HTMLVideoElement) => boolean;


export default class FourdTexture {
  private videoDom: HTMLVideoElement;
  private onFrameDecoded: FrameDecodedCallback;
  private onLoadingStateChanged: (loadingState: boolean) => void;
  private playedFrameNumber: number | undefined;
  private totalFrameCount: number | undefined;

  isLoading: boolean;

  constructor(resourceURL: string,
              onFrameDecoded: FrameDecodedCallback,
              onLoadingStateChanged: (loadingState: boolean) => void) {
    this.isLoading = true;

    // HTML Dom
    this.videoDom = document.createElement('video');
    this.videoDom.muted = true;
    this.videoDom.playsInline = true;
    this.videoDom.loop = true;
    this.videoDom.style.display = 'none';

    const srcDom = document.createElement('source');
    srcDom.setAttribute('src', resourceURL);
    srcDom.setAttribute('type', 'video/mp4')
    this.videoDom.prepend(srcDom);

    document.body.append(this.videoDom);

    // Event
    this.videoDom.addEventListener('durationchange', () => {
      this.totalFrameCount =  Math.round(this.videoDom.duration * CONFIG.texture.fps);
    });
    this.videoDom.addEventListener('seeked', () => this.setLoadingState(false));
    this.videoDom.addEventListener('playing', () => {
      this.videoDom.requestVideoFrameCallback(
        (now, metadata) => {this.videoFrameCallback(metadata)}
      );
      this.setLoadingState(false);
    });
    this.videoDom.addEventListener('waiting', () => this.setLoadingState(true));
    this.videoDom.addEventListener('seeking', () => this.setLoadingState(true));

    // Callback
    this.onLoadingStateChanged = onLoadingStateChanged;
    this.onFrameDecoded = onFrameDecoded;
  }

  setLoadingState(loadingState: boolean) {
    if (loadingState === this.isLoading) return;
    this.isLoading = loadingState;
    this.onLoadingStateChanged(loadingState);
  }

  videoFrameCallback(metadata: VideoFrameMetadata) {
    const currentFrame = Math.round(metadata.mediaTime * CONFIG.texture.fps);

    if (currentFrame === this.playedFrameNumber) {
      console.warn('Duplicated frame callback conflict');
      return;
    }
    this.playedFrameNumber = currentFrame;

    const success = this.onFrameDecoded(currentFrame, this.totalFrameCount, this.videoDom);
    if (!success) {
      this.videoDom.pause();
      return;
    }

    this.videoDom.requestVideoFrameCallback(
      (now, metadata) => {this.videoFrameCallback(metadata)}
    );
  }

  play() {
    if (!this.videoDom.paused) return;
    this.videoDom.play().then(
      () => console.log('play'),
      error => console.warn(error)
    );
  }
}
