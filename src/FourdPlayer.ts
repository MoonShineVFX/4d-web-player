import FourdTexture, {TextureState} from './FourdTexture';
import FourdEngine from './FourdEngine';
import FourdMesh, {PlayFrameState} from './FourdMesh';
import CONFIG from './Config';
import {ConfigMetadata} from './Config';


export default class FourdPlayer {
  private engine: FourdEngine;
  private mesh: FourdMesh;
  private texture: FourdTexture;

  private lastTimeStamp: number | null;
  private renderDuration: number;

  private isLoading: boolean;

  private onStateChanged: (textureState: TextureState) => void;

  constructor(
    canvasDom: HTMLCanvasElement,
    textureUrl: string,
    meshUrls: string[],
    onStateChanged: (textureState: TextureState) => void,
    metadata?: ConfigMetadata
  ) {
    // Apply config first
    if (metadata) CONFIG.applyMetadata(metadata);

    // Defines
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

  private animate() {
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

  private onTextureFrameDecoded(frameNumber: number, videoDom: HTMLVideoElement): boolean {
    console.debug('Play frame: ', frameNumber);

    if (!CONFIG.isSafari) frameNumber += CONFIG.player.meshFrameOffset;
    
    const playFrameResult = this.mesh.playFrame(frameNumber);
    if (playFrameResult.state === PlayFrameState.Loading) return false;
    if (playFrameResult.state === PlayFrameState.Success) {
      this.engine.updateFrame(videoDom, playFrameResult.payload!);
    }

    return true
  }

  private onMeshLoadingStateChanged() {
    this.updateLoadingState();
    console.debug('Mesh buffer completed.');
  }

  private onTextureStateChanged() {
    this.updateLoadingState();
    this.emitStateChanged();
  }

  private updateLoadingState() {
    const loadingState = this.mesh.isLoading || this.texture.state.isLoading;
    if (loadingState === this.isLoading) return;
    this.isLoading = loadingState;
    if (!this.isLoading) this.texture.play();
    this.emitStateChanged();
  }

  private emitStateChanged() {
    if (!this.onStateChanged) return;

    this.onStateChanged({
      ...this.texture.state,
      isLoading: this.isLoading
    });
  }

  playTexture() {
    this.texture.play();
  }

  pauseTexture() {
    this.texture.pause();
  }

  seekTexture(seekTime: number) {
    this.texture.seek(seekTime);
  }
}
