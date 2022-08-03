import CONFIG from './Config';


type FrameDecodedCallback = (frameNumber: number, videoDom: HTMLVideoElement) => boolean;


export default class FourdTexture {
  private videoDom: HTMLVideoElement;
  private frameDecodedCallback: FrameDecodedCallback;

  constructor(elementID: string, resourceURL: string, onFrameDecoded: FrameDecodedCallback) {
    // Video Dom
    this.videoDom = document.getElementById(elementID) as HTMLVideoElement;
    const srcDom = document.createElement('source');
    srcDom.setAttribute('src', resourceURL);
    srcDom.setAttribute('type', 'video/mp4')
    this.videoDom.prepend(srcDom);

    //
    this.frameDecodedCallback = onFrameDecoded;

    // Frame callback
    this.videoDom.requestVideoFrameCallback(
      (now, metadata) => {this.videoFrameCallback(metadata)}
    )
  }

  videoFrameCallback(metadata: VideoFrameMetadata) {
    const currentFrame = Math.round(metadata.mediaTime * CONFIG.texture.fps);
    const success = this.frameDecodedCallback(currentFrame, this.videoDom);
    if (!success) {
      this.videoDom.pause();
      return;
    }

    this.videoDom.requestVideoFrameCallback(
      (now, metadata) => {this.videoFrameCallback(metadata)}
    );
  }

  decode() {
    this.videoDom.requestVideoFrameCallback(
      (now, metadata) => {this.videoFrameCallback(metadata)}
    )
    this.videoDom.play();
  }
}
