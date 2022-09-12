import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import CONFIG from './Config';


interface GltfData {
  animations: THREE.AnimationClip[];
  scene: THREE.Group;
  scenes: THREE.Group[];
  cameras: THREE.Camera[];
  asset: object;
}

enum MeshFrameState {
  Empty,
  Loading,
  Loaded
}

interface MeshFrame {
  mesh: THREE.Group | null;  // gltf scene
  state: MeshFrameState;
}

export enum PlayFrameState {
  Success,
  Loading,
  Missing
}

interface PlayFrameResult {
  state: PlayFrameState,
  payload?: THREE.Group
}


export default class FourdMesh {
  private playedFrameNumber: number;

  private readonly material: THREE.Material;

  private readonly frames: MeshFrame[];
  private urls: string[];
  private hiresUrls?: string[];

  private loader: GLTFLoader;
  private readonly dracoLoader: DRACOLoader;

  private onLoadingStateChanged: (loadingState: boolean) => void;
  isLoading: boolean;

  constructor(
    material: THREE.Material = null,
    urls: string[],
    onLoadingStateChanged: (loadingState: boolean) => void,
    hiresUrls?: string[]
  ) {
    this.playedFrameNumber = 0;
    this.material = material;

    this.frames = [];
    this.urls = urls;
    this.hiresUrls = hiresUrls;

    this.isLoading = true;
    this.onLoadingStateChanged = onLoadingStateChanged;

    // Build frames
    for (let i = 0; i < this.urls.length; i++) {
      this.frames.push({mesh: null, state: MeshFrameState.Empty});
    }

    // Three.js
    this.loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(CONFIG.mesh.dracoPath);
    this.loader.setDRACOLoader(this.dracoLoader);

    // Load
    this.preloadFrames();
  }

  private preloadFrame(frameNumber: number) {
    const meshFrame = this.frames[frameNumber];
    if (meshFrame.state !== MeshFrameState.Empty) return;

    meshFrame.state = MeshFrameState.Loading;
    this.loader.load(
      this.urls[frameNumber],
      (gltf: GltfData) => this.onGltfLoaded(frameNumber, gltf)
    );
  }

  private preloadFrames() {
    for (let i = 0; i < CONFIG.mesh.bufferWhileWaitingCount + 1; i++) {
      this.preloadFrame((this.playedFrameNumber + i) % this.frames.length);
    }
  }

  private onGltfLoaded(frameNumber: number, gltf: GltfData) {
    // Add gltf to frames
    const mesh = gltf.scene.children[0] as THREE.Mesh;

    if (this.material) {
      const old_material = mesh.material as THREE.Material;
      mesh.material = this.material;
      old_material.dispose();
    }

    mesh.geometry.computeVertexNormals();

    this.frames[frameNumber] = {
      mesh: gltf.scene,
      state: MeshFrameState.Loaded
    };

    if (this.isLoading && this.isBufferedEnough()) {
      this.setLoadingState(false);
    }
  }

  private setLoadingState(loadingState: boolean) {
    if (loadingState === this.isLoading) return;
    this.isLoading = loadingState;
    this.onLoadingStateChanged(loadingState);
  }

  private isBufferedEnough(): boolean {
    const enoughCount = this.isLoading ? CONFIG.mesh.bufferWhileWaitingCount : CONFIG.mesh.bufferWhilePlayingCount;
    for (let i = 0; i < enoughCount; i++) {
      if (
        this.frames[(this.playedFrameNumber + i) % this.frames.length].state !== MeshFrameState.Loaded
      ) return false;
    }
    if (this.isLoading) this.setLoadingState(false);
    return true;
  }

  playFrame(playFrameNumber: number): PlayFrameResult {
    // Bypass when loading
    if (this.isLoading) return {state: PlayFrameState.Loading};

    if (playFrameNumber >= this.urls.length) {
      console.warn('Missing Mesh Frame!');
      return {state: PlayFrameState.Missing};
    }

    // Purge played frame
    if (this.playedFrameNumber !== playFrameNumber) {
      this.frames[this.playedFrameNumber] = {mesh: null, state: MeshFrameState.Empty};

      // Check if frame is continue
      if (playFrameNumber !== (this.playedFrameNumber + 1) % this.frames.length) {
        // Purge unused cache
        const keepStartFrameNumber = playFrameNumber;
        const keepEndFrameNumber = (playFrameNumber + CONFIG.mesh.bufferWhileWaitingCount) % this.frames.length;
        let purgeRanges: [number, number][] = [];
        if (keepEndFrameNumber < keepStartFrameNumber) {
          purgeRanges.push([keepEndFrameNumber + 1, keepStartFrameNumber]);
        } else {
          purgeRanges.push([0, keepStartFrameNumber]);
          purgeRanges.push([keepEndFrameNumber + 1, this.frames.length]);
        }
        purgeRanges.forEach(purgeRange => {
          const [startFrameNumber, EndFrameNumber] = purgeRange;
          for (let i = startFrameNumber; i < EndFrameNumber; i++) {
            this.frames[i] = {mesh: null, state: MeshFrameState.Empty};
          }
        });

        // Preload frames
        this.preloadFrames();
      }

      // Set played frame
      this.playedFrameNumber = playFrameNumber;
    }

    // Check buffer
    if (!this.isBufferedEnough()) {
      // Preload count must +1 because this function will execute from next frame (video.play())
      this.preloadFrames();
      this.setLoadingState(true);
      console.warn('Mesh buffer not enough', this.playedFrameNumber);
      return {state: PlayFrameState.Loading};
    }

    // Get meshFrame
    const currentMeshFrame = this.frames[this.playedFrameNumber];
    this.preloadFrame((this.playedFrameNumber + CONFIG.mesh.bufferWhileWaitingCount - 1) % this.frames.length);

    return {
      state: PlayFrameState.Success,
      payload: currentMeshFrame.mesh
    };
  }
}
