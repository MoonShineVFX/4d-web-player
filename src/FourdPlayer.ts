import FourdTexture from './FourdTexture';
import FourdEngine from './FourdEngine';
import FourdMesh from './FourdMesh';
import CONFIG from './Config';

import {TextureState} from './FourdTexture';


export type FourdPlayerState = TextureState;


export default class FourdPlayer {
  private engine: FourdEngine;
  private mesh: FourdMesh;
  private texture: FourdTexture;

  private lastTimeStamp: number | null;
  private renderDuration: number;

  private isLoading: boolean;

  private onStateChanged: (playerState: FourdPlayerState) => void;

  constructor(
    canvasDom: HTMLCanvasElement,
    textureUrl: string,
    meshUrls: string[],
    onStateChanged: (playerState: FourdPlayerState) => void
  ) {
    this.lastTimeStamp = null;
    this.renderDuration = 1000 / CONFIG.player.fps;

    this.isLoading = true;

    this.onStateChanged = onStateChanged;

    this.engine = new FourdEngine(canvasDom);
    this.mesh = new FourdMesh(
      this.engine.uniMaterial,
      meshUrls,
      () => this.onMeshLoadingStateChanged()
    );
    this.texture = new FourdTexture(
      textureUrl,
      (frameNumber: number, videoDom: HTMLVideoElement) => {
        return this.onTextureFrameDecoded(frameNumber, videoDom)
      },
      () => this.onTextureStateChanged()
    );

    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const now = Date.now();
    if (!this.lastTimeStamp) {
      this.lastTimeStamp = now;
      return;
    }
    const delta = now - this.lastTimeStamp;
    if (delta > this.renderDuration) {
      this.lastTimeStamp = now - (delta % this.renderDuration);
      this.engine.render();
    }
  }

  onTextureFrameDecoded(frameNumber: number, videoDom: HTMLVideoElement): boolean {
    console.debug('Play frame: ', frameNumber);

    const frameMesh = this.mesh.playFrame(frameNumber);
    if (!frameMesh) return false;

    this.engine.updateFrame(videoDom, frameMesh);
    return true
  }

  onMeshLoadingStateChanged() {
    this.updateLoadingState();
    console.debug('Mesh buffer completed.');
  }

  onTextureStateChanged() {
    this.updateLoadingState();
    this.emitStateChanged();
  }

  updateLoadingState() {
    const loadingState = this.mesh.isLoading || this.texture.state.isLoading;
    if (loadingState === this.isLoading) return;
    this.isLoading = loadingState;
    if (!this.isLoading) this.texture.play();
    this.emitStateChanged();
  }

  emitStateChanged() {
    if (!this.onStateChanged) return;

    this.onStateChanged({
      ...this.texture.state,
      isLoading: this.isLoading
    });
  }
}
