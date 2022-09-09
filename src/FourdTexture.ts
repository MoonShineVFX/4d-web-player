import CONFIG from './Config';


type FrameDecodedCallback = (frameNumber: number, videoDom: HTMLVideoElement) => boolean;

export interface TextureState {
  isLoading: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  muted: boolean;
}


export default class FourdTexture {
  private videoDom: HTMLVideoElement;
  private onFrameDecoded: FrameDecodedCallback;
  private onStateChanged: (textureState: TextureState) => void;
  private playedFrameNumber: number | undefined;

  state: TextureState;

  constructor(resourceURL: string,
              onFrameDecoded: FrameDecodedCallback,
              onStateChanged: (textureState: TextureState) => void) {
    this.state = {
      isLoading: true,
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      volume: 1.0,
      muted: false
    };

    // Video Dom
    this.videoDom = document.createElement('video');
    this.videoDom.setAttribute('crossorigin', 'anonymous');
    this.videoDom.playsInline = true;
    this.videoDom.loop = true;
    this.videoDom.style.display = 'none';

    // Video events
    const listenEvents = [
      'pause', 'playing', 'waiting', 'loadedmetadata', 'seeking', 'seeked',
      'durationchange', 'timeupdate', 'volumechange', 'error', 'canplay', 'suspend', 'stalled'
    ];
    listenEvents.forEach(eventName => {
      this.videoDom.addEventListener(eventName, event => this.handleVideoEvent(event));
    });

    // Video source
    const srcDom = document.createElement('source');
    srcDom.setAttribute('src', resourceURL);
    srcDom.setAttribute('type', 'video/mp4')
    this.videoDom.prepend(srcDom);

    document.body.append(this.videoDom);

    // Callback
    this.onStateChanged = onStateChanged;
    this.onFrameDecoded = onFrameDecoded;
  }

  private handleVideoEvent(event: Event) {
    switch(event.type) {
      case 'error':
      case 'stalled':
      case 'suspend':
        console.error('Video loading error', event.type);
        break;
      case 'loadedmetadata':
      case 'canplay':
        console.log('metadata loaded');
        this.setState({
          ...this.state,
          isPlaying: !this.videoDom.paused,
          isLoading: false,
          currentTime: this.videoDom.currentTime,
          volume: this.videoDom.volume,
          muted: this.videoDom.muted,
          duration: this.videoDom.duration
        });
        break;
      case 'timeupdate':
        this.setState({
          ...this.state,
          currentTime: this.videoDom.currentTime
        });
        break;
      case 'durationchange':
        this.setState({
          ...this.state,
          duration: this.videoDom.duration
        })
        break;
      case 'playing':
      case 'seeked':
        if (event.type === 'playing') {
          this.videoDom.requestVideoFrameCallback(
            (now, metadata) => {this.videoFrameCallback(metadata)}
          );
        }
        this.setState({
          ...this.state,
          isLoading: false,
          isPlaying: true,
          currentTime: this.videoDom.currentTime
        })
        break;
      case 'pause':
        this.setState({
          ...this.state,
          isPlaying: false
        });
        break;
      case 'waiting':
      case 'seeking':
        this.setState({
          ...this.state,
          isLoading: true
        });
        break;
      case 'volumechange':
        this.setState({
          ...this.state,
          volume: this.videoDom.volume,
          muted: this.videoDom.muted
        });
        break;
      default:
        console.warn(event.type);
    }
  }

  private setState(state: TextureState) {
    if (state === this.state) return;
    this.state = state;
    this.onStateChanged(this.state);
  }

  private videoFrameCallback(metadata: VideoFrameMetadata) {
    const currentFrame = Math.round(metadata.mediaTime * CONFIG.texture.fps);

    if (currentFrame === this.playedFrameNumber) {
      console.warn('Duplicated frame callback conflict');
      return;
    }
    this.playedFrameNumber = currentFrame;

    const success = this.onFrameDecoded(currentFrame, this.videoDom);
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
      () => console.debug('play texture'),
      error => console.warn(error)
    );
  }

  pause() {
    if (this.videoDom.paused) return;
    this.videoDom.pause();
  }

  seek(seekTime: number) {
    this.videoDom.currentTime = seekTime;
  }
}
