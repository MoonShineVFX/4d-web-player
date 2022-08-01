import {TextureFrameDecoder, TextureOnNextCallback} from './defines';
import {fetchWithProgress} from '../utility';


export default class VideoFrameDecoder extends TextureFrameDecoder {
  private videoDom: HTMLVideoElement;
  private frameText: HTMLHeadingElement;
  private waiting: boolean;
  private currentFrame: number;

  constructor(
    onNext: TextureOnNextCallback,
    elementID: string
  ) {
    super();
    this.onNext = onNext;
    this.videoDom = document.getElementById(elementID) as HTMLVideoElement;
    this.waiting = true;
    this.currentFrame = 0;

    const self = this;
    document.getElementById('next').addEventListener('pointerdown', () => {
        self.videoDom.play();
      }
    );
    this.frameText = document.getElementById('frame-number') as HTMLHeadingElement;
  }


  open(source: any): Promise<string> {
    const isValidSource = typeof source === 'string';

    const self = this;

    const promise = new Promise<string>((resolve, reject) => {
      if (!isValidSource) {
        reject('Invalid source');
        return;
      }

      self.openResolve = resolve;
      self.openReject = reject;

      this.videoDom.addEventListener('canplaythrough', () => {
        this.waiting = false;
        this.isReady = true;
        self.openResolve('ready!');
      });
      this.videoDom.addEventListener('error', error => self.openReject(error.message));
      this.videoDom.addEventListener('playing', () => self.waiting = false);
      this.videoDom.addEventListener('waiting', () => self.waiting = true);
      this.videoDom.addEventListener('seeking', () => self.waiting = true);
      this.videoDom.addEventListener('seeked', () => self.waiting = false);

      this.videoDom.load()
    });

    if (isValidSource) {
      const sourceElement = document.createElement('source');
      sourceElement.setAttribute('src', source);
      sourceElement.setAttribute('type', 'video/mp4')
      this.videoDom.appendChild(sourceElement);
      this.videoDom.loop = true;
      this.videoDom.requestVideoFrameCallback((now, metadata) => {
        self.test(now, metadata);
      });
    }

    return promise;
  }

  isNextFrameAvailable(): boolean {
    return !this.waiting;
  }

  test(now: any, metadata: any) {
    const currentFrame = Math.round(metadata.mediaTime  * 30);
    // this.videoDom.pause();
    this.onNext(this.videoDom, currentFrame);
    const self = this;
    this.videoDom.requestVideoFrameCallback((now, metadata) => {
      self.test(now, metadata);
    });
    this.frameText.innerText = currentFrame.toString();
    // this.frameText.innerText = JSON.stringify(metadata, null, 2);
    console.log('video: ' + currentFrame);
  }

  playNextFrame() {
    return;
    // @ts-ignore
    this.videoDom.requestVideoFrameCallback((now, metadata) => {
      this.onNext(this.videoDom);
    });
    this.currentFrame += 1;
    this.videoDom.currentTime = this.currentFrame * (1/30);
    console.log(this.currentFrame);
  }
}
