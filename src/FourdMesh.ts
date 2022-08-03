import * as THREE from 'three';

import { GLTFLoader } from './external/GLTFLoader';
import { DRACOLoader } from './external/DRACOLoader';

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


export default class FourdMesh {
  private currentFrameNumber: number;

  private readonly material: THREE.Material;

  private readonly frames: MeshFrame[];
  private urls: string[];

  private loader: GLTFLoader;
  private readonly dracoLoader: DRACOLoader;

  private isWaitingBuffer: boolean;

  constructor(
    material: THREE.Material = null,
    urls: string[]
  ) {
    this.currentFrameNumber = 0;
    this.material = material;

    this.frames = [];
    this.urls = urls;

    this.isWaitingBuffer = false;

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
    this.load();
  }

  private load() {
    for (let i = 0; i < CONFIG.mesh.bufferFrameCount + 1; i++) {
      this.preloadFrame(i);
    }
  }

  private preloadFrame(frameNumber: number) {
    const meshFrame = this.frames[frameNumber];
    if (meshFrame.state !== MeshFrameState.Empty) return;

    meshFrame.state = MeshFrameState.Loading;
    fetch(this.urls[frameNumber]).then(
      response => response.arrayBuffer()
    ).then(arrayBuffer => {
      this.loader.parse(
        arrayBuffer, '',
        (gltf: GltfData) => this.onGltfLoaded(frameNumber, gltf)
      );
    });
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
  }

  isBufferedEnough(frameNumber: number = undefined): boolean {
    const enoughRatio = this.isWaitingBuffer ? 1.0 : 0.2;
    const checkFrameNumber = frameNumber || this.currentFrameNumber;
    for (let i = 0; i < Math.ceil(CONFIG.mesh.bufferFrameCount * enoughRatio); i++) {
      if (this.frames[(checkFrameNumber + i) % this.frames.length].state !== MeshFrameState.Loaded) return false;
    }
    if (this.isWaitingBuffer) this.isWaitingBuffer = false;
    return true;
  }

  playFrame(playFrameNumber: number): THREE.Group | undefined {
    // Check if frame is continue
    if (playFrameNumber !== (this.currentFrameNumber + 1) % this.frames.length && playFrameNumber !== this.currentFrameNumber) {
      // Purge unused cache
      const keepStartFrameNumber = playFrameNumber;
      const keepEndFrameNumber = (playFrameNumber + CONFIG.mesh.bufferFrameCount) % this.frames.length;
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
    }

    // Check buffer
    if (!this.isBufferedEnough(playFrameNumber)) {
      // Preload count must +1 because this function will execute from next frame (video.play())
      for (let i = 0; i < CONFIG.mesh.bufferFrameCount + 1; i++) {
        this.preloadFrame((playFrameNumber + i) % this.frames.length);
      }
      this.isWaitingBuffer = true;
      console.warn('Mesh buffer not enough', playFrameNumber);
      return undefined;
    }

    // Get meshFrame
    if (this.currentFrameNumber !== playFrameNumber) {
      // this.frames[this.currentFrameNumber] = {mesh: null, state: MeshFrameState.Empty};
      this.currentFrameNumber = playFrameNumber;
    }
    const currentMeshFrame = this.frames[this.currentFrameNumber];
    this.preloadFrame((this.currentFrameNumber + CONFIG.mesh.bufferFrameCount - 1) % this.frames.length);

    console.debug('Gltf frame: ', this.currentFrameNumber);
    return currentMeshFrame.mesh;
  }
}
