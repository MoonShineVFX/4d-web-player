import CONFIG from './config';
import Engine from './engine';
import GltfFrameDecoder from './frameDecoders/gltfFrameDecoder';
import { MeshFrameDecoder, TextureFrameDecoder } from './frameDecoders/defines';
import {Mp4FrameDecoder} from './frameDecoders/mp4FrameDecoder';


export enum TextureType {
  MP4,
  JPG
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
      this.textureDecoder = new Mp4FrameDecoder(
        imageData => this.threeEngine.updateRawTexture(imageData),
        progressPercent => console.log('mp4 load: ' + progressPercent)
      );
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

  loadTexture(url: string) {
    let textureLoading;
    if (this.textureType === TextureType.MP4) {
      textureLoading = this.textureDecoder.open(url);
    } else if (this.textureType === TextureType.JPG) {
      // textureLoading = this.textureDecoder.importUrls(url);
    }
    this.readyQueue.push(textureLoading);
  }

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
      console.warn('Decoder is buffering.');
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
