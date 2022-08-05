import FourdTexture from './FourdTexture';
import FourdEngine from './FourdEngine';
import FourdMesh from './FourdMesh';
import CONFIG from './Config';


export default class FourdPlayer {
  private engine: FourdEngine;
  private mesh: FourdMesh;
  private texture: FourdTexture;

  private lastTimeStamp: number | null;
  private renderDuration: number;

  private isLoading: boolean;
  private onLoadingStateChanged: (loadingState: boolean) => void;

  private onPlaying: (frameNumber: number, totalFrame: number) => void | null = null;

  constructor(
    engineElementId: string,
    textureUrl: string,
    meshUrls: string[],
    onLoadingStateChanged: (loadingState: boolean) => void | null = null,
    onPlaying: (frameNumber: number, totalFrame: number) => void | null = null
  ) {
    this.lastTimeStamp = null;
    this.renderDuration = 1000 / CONFIG.player.fps;
    this.isLoading = true;
    this.onLoadingStateChanged = onLoadingStateChanged;

    this.onPlaying = onPlaying;

    this.engine = new FourdEngine(engineElementId);
    this.mesh = new FourdMesh(
      this.engine.uniMaterial,
      meshUrls,
      state => this.onMeshLoadingStateChanged(state)
    );
    this.texture = new FourdTexture(
      textureUrl,
      (frameNumber: number, totalFrameCount: number, videoDom: HTMLVideoElement) => {
        return this.onTextureFrameDecoded(frameNumber, totalFrameCount, videoDom)
      },
      (loadingState: boolean) => this.onTextureLoadingStateChanged(loadingState)
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

  onTextureFrameDecoded(frameNumber: number, totalFrameCount: number, videoDom: HTMLVideoElement): boolean {
    console.debug('Play frame: ', frameNumber, '/', totalFrameCount);

    const frameMesh = this.mesh.playFrame(frameNumber);
    if (!frameMesh) return false;

    this.engine.updateFrame(videoDom, frameMesh);
    if (this.onPlaying) this.onPlaying(frameNumber, totalFrameCount);

    return true
  }

  onMeshLoadingStateChanged(loadingState: boolean) {
    this.checkLoadingState();
    if (loadingState) return;
    this.texture.play();
    console.log('Mesh buffer completed.');
  }

  onTextureLoadingStateChanged(loadingState: boolean) {
    this.checkLoadingState();
  }

  checkLoadingState() {
    this.setLoadingState(this.mesh.isLoading || this.texture.isLoading);
  }

  setLoadingState(loadingState: boolean) {
    if (loadingState === this.isLoading) return;
    this.isLoading = loadingState;
    if (this.onLoadingStateChanged) this.onLoadingStateChanged(loadingState);
  }
}
