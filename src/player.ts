import CONFIG from './config';
import Engine from './engine';
import GltfFrameDecoder from './frameDecoders/gltfFrameDecoder';
import { FrameDecoder } from './frameDecoders/defines';


export enum TextureType {
  MP4,
  JPG
}


export class FourdRecPlayer {
  private threeEngine: Engine;

  private meshDecoder: FrameDecoder;
  private textureDecoder: FrameDecoder | null;

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
      //a this.textureExtractor = new Mp4FrameExtractor();
    } else if (this.textureType === TextureType.JPG) {
      //a this.textureExtractor = new JpegFrameExtractor();
      // this.textureDecoder.onNext = imageData => this.threeEngine.updateRawTexture(imageData);
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

  //a loadTextureFromUrl(url) {
  //   let textureLoading;
  //   if (this.textureType === TextureType.MP4) {
  //     textureLoading = this.textureDecoder.loadArrayBufferFromURL(url);
  //   } else if (this.textureType === TextureType.JPG) {
  //     textureLoading = this.textureDecoder.importUrls(url);
  //   }
  //   this.readyQueue.push(textureLoading);
  // }

  play() {
    console.debug('Start playing');
    this.isPlaying = true;
  }

  tickNextFrame() {
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
      this.deltaTime = -CONFIG.player.delayDuration;
      return
    }

    this.meshDecoder.playNextFrame();
    if (this.textureDecoder) this.textureDecoder.playNextFrame();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.tickNextFrame();
    this.threeEngine.render();
  }
}
