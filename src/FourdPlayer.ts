import FourdTexture, {TextureState} from './FourdTexture';
import FourdEngine from './FourdEngine';
import FourdMesh, {MeshFrameState, PlayFrameState} from './FourdMesh';
import CONFIG, {ConfigMetadata} from './Config';


export default class FourdPlayer {
  private engine: FourdEngine;
  private mesh: FourdMesh;
  private texture: FourdTexture;

  private lastTimeStamp: number | null;
  private renderDuration: number;

  private isLoading: boolean;

  private hasHires: boolean;
  private lastPlayedFrame?: number;
  private hiresMeshState: MeshFrameState;

  private onStateChanged: (textureState: TextureState) => void;
  private onHiresStateChanged?: (hiresMeshState: MeshFrameState) => void;

  constructor(
    canvasDom: HTMLCanvasElement,
    textureUrl: string,
    meshUrls: string[],
    onStateChanged: (textureState: TextureState) => void,
    metadata?: ConfigMetadata,
    hiresUrls?: string[],
    onHiresStateChanged?: (hiresMeshState: MeshFrameState) => void
  ) {
    // Apply config first
    if (metadata) CONFIG.applyMetadata(metadata);

    // Defines
    this.lastTimeStamp = null;
    this.renderDuration = 1000 / CONFIG.player.fps;

    this.isLoading = true;
    this.hasHires = hiresUrls !== undefined;
    this.hiresMeshState = MeshFrameState.Empty;

    this.onStateChanged = onStateChanged;
    this.onHiresStateChanged = onHiresStateChanged;

    this.engine = new FourdEngine(canvasDom);
    this.mesh = new FourdMesh(
      this.engine.uniMaterial,
      meshUrls,
      () => this.onMeshLoadingStateChanged(),
      hiresUrls
    );
    this.texture = new FourdTexture(
      textureUrl,
      (frameNumber: number, videoDom: HTMLVideoElement, isPause: boolean) => {
        return this.onTextureFrameDecoded(frameNumber, videoDom, isPause)
      },
      () => this.onTextureStateChanged()
    );

    // this.animate();
    this.engine.updateForXR()
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

  private onTextureFrameDecoded(frameNumber: number, videoDom: HTMLVideoElement, isPause: boolean): boolean {
    console.debug('Play texture frame: ', frameNumber);
    if (this.hiresMeshState !== MeshFrameState.Empty) this.setHiresMeshState(MeshFrameState.Empty);

    let offsetFrameNumber = frameNumber;
    if (!CONFIG.isSafari) offsetFrameNumber += CONFIG.player.meshFrameOffset;
    if (offsetFrameNumber < 0) return true;
    this.lastPlayedFrame = offsetFrameNumber;
    console.debug('Play mesh frame: ', offsetFrameNumber);

    const playFrameResult = this.mesh.playFrame(offsetFrameNumber);
    if (playFrameResult.state === PlayFrameState.Loading) return false;
    if (playFrameResult.state === PlayFrameState.Success) {
      this.engine.updateFrame(videoDom, playFrameResult.payload!);
    }

    if (isPause && this.hasHires) {
      this.setHiresMeshState(MeshFrameState.Loading);
      this.mesh.playHiresFrame(offsetFrameNumber).then(
        mesh => {
          if (offsetFrameNumber !== this.lastPlayedFrame) return;
          this.engine.updateMesh(mesh, true);
          this.setHiresMeshState(MeshFrameState.Loaded);
        }
      );
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

  private setHiresMeshState(meshFrameState: MeshFrameState) {
    if (this.hiresMeshState === meshFrameState) return;
    this.hiresMeshState = meshFrameState;
    if (this.onHiresStateChanged) this.onHiresStateChanged(this.hiresMeshState);
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
