import CONFIG from './config';
import Engine from './engine';
import {
  MeshFrameDecoder,
  TextureFrameDecoder,
  GltfFrameDecoder,
  Mp4FrameDecoder,
  JpegFrameDecoder
} from './frameDecoders';
import VideoFrameDecoder from './frameDecoders/videoFrameDecoder';


export enum TextureType {
  MP4,
  JPEG
}


export class FourdRecPlayer {
  private threeEngine: Engine;

  private meshDecoder: MeshFrameDecoder;
  private textureDecoder: TextureFrameDecoder | null;

  private readonly textureType: TextureType | null;

  private readyQueue: Promise<string>[];

  private isPlaying: boolean;
  private lastTimeStamp: number | null;
  private deltaTime: number;

  constructor(textureType: TextureType | null) {
    this.threeEngine = new Engine();

    this.meshDecoder = undefined;
    this.textureDecoder = undefined;
    this.textureType = textureType;

    this.readyQueue = [];

    this.isPlaying = false;
    this.lastTimeStamp = null;
    this.deltaTime = 0;

    this.initialize();
  }

  initialize() {
    // Mesh: now gltf only
    this.meshDecoder = new GltfFrameDecoder(
      this.threeEngine.uniMaterial,
      (oldGroup, newGroup) => {
        this.threeEngine.replaceSceneGroup(oldGroup, newGroup);
      },
      null
    );

    // Texture
    if (this.textureType === TextureType.MP4) {
      // this.textureDecoder = new Mp4FrameDecoder(
      //   imageData => this.threeEngine.updateRawTexture(imageData),
      //   progressPercent => console.log('mp4 load: ' + progressPercent)
      // );
      this.textureDecoder = new VideoFrameDecoder(
        (imageData, currentFrame) => {
          if (!this.isPlaying) return;
          this.threeEngine.updateRawTexture(imageData);
          this.meshDecoder.playNextFrame(currentFrame);
        },
        'video-player'
      );
    } else if (this.textureType === TextureType.JPEG) {
      this.textureDecoder = new JpegFrameDecoder(
        imageData => this.threeEngine.updateRawTexture(imageData),
        progressPercent => console.log('jpg load: ' + progressPercent)
      );
    } else {
      this.textureDecoder = null;
    }

    // Controls
    document.addEventListener('keydown', event => {
      if (event.code === 'Space') {
        this.isPlaying = !this.isPlaying;
        event.preventDefault();
      }
    })

    // Render
    this.animate();
  }

  loadMesh(source: String[] | FileList) {
    this.readyQueue.push(this.meshDecoder.open(source));

    // Auto start when all components loaded, must move to better position
    Promise.all(this.readyQueue).then(() => this.play());
  }

  loadTexture(source: string | string[]) {
    this.readyQueue.push(this.textureDecoder.open(source));
  }

  play() {
    console.debug('Start playing');
    this.isPlaying = true;
  }

  tick(): boolean {
    if (!this.isPlaying) return;
    if (!this.lastTimeStamp) {
      this.lastTimeStamp = performance.now();
      return;
    }
    const currentTimeStamp = performance.now();
    this.deltaTime += currentTimeStamp - this.lastTimeStamp;
    this.lastTimeStamp = currentTimeStamp;

    if (this.deltaTime < CONFIG.player.frameDuration) return;
    this.deltaTime %= CONFIG.player.frameDuration;

    if ((this.textureDecoder && !this.textureDecoder.isNextFrameAvailable()) ||
      !this.meshDecoder.isNextFrameAvailable()) {
      console.warn('Decoder is buffering.');
      this.deltaTime = -CONFIG.player.delayDuration;
      return
    }

    this.meshDecoder.playNextFrame();
    if (this.textureDecoder) this.textureDecoder.playNextFrame();

    return true;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    // this.tick();
    this.threeEngine.render();
  }
}
