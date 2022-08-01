import * as THREE from 'three';

import { GLTFLoader } from '../external/GLTFLoader';
import { DRACOLoader } from '../external/DRACOLoader';

import { MeshFrameDecoder, MeshOnNextCallback, OnLoadingCallback } from './defines';
import { nextWithLoop} from '../utility';
import CONFIG from '../config';


enum LoadType {
  FILE,
  URL
}


interface GltfData {
  animations: THREE.AnimationClip[];
  scene: THREE.Group;
  scenes: THREE.Group[];
  cameras: THREE.Camera[];
  asset: object;
}


export default class GltfFrameDecoder extends MeshFrameDecoder {
  private currentMeshIndex: number;
  private initialPreloadedFrameCount: number;

  private readonly material: THREE.Material;

  private readonly gltfScenes: THREE.Group[];
  private readonly files: File[];
  private urls: string[];

  private loadType: LoadType | null;

  private loader: GLTFLoader;
  private readonly dracoLoader: DRACOLoader;

  private buffering: boolean;

  frameCount: number;

  constructor(
    material: THREE.Material = null,
    onNext: MeshOnNextCallback,
    onLoading: OnLoadingCallback | null
  ) {
    super();

    this.currentMeshIndex = -1;
    this.initialPreloadedFrameCount = CONFIG.decoder.gltfPreloadFrameCount;

    this.material = material;

    this.gltfScenes = [];
    this.files = [];
    this.urls = [];
    this.loadType = null;

    this.onNext = onNext;
    this.onLoading = onLoading;

    // Three.js
    this.loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(CONFIG.decoder.dracoPath);
    this.loader.setDRACOLoader(this.dracoLoader);

    this.buffering = false;
  }

  open(source: FileList): Promise<string>;
  open(source: string): Promise<string>;
  override open(source: any): Promise<string> {
    const self = this;
    return new Promise<string>((resolve, reject) => {
      // Check Array
      const isFiles = source instanceof FileList;
      if (!(Array.isArray(source) || isFiles) || source.length === 0) {
        console.error('source is not valid: ', source);
        reject();
        return;
      }

      self.openResolve = resolve;
      self.frameCount = source.length;

      if (isFiles) {
        self.openFiles(source);
      } else if (typeof source[0] === 'string') {
        self.openUrls(source);
      } else {
        console.error('source is not valid: ', source);
        reject();
      }
    });
  }

  private openUrls(urls: string[]) {
    this.loadType = LoadType.URL;

    this.urls = urls;

    for (let i = 0; i < CONFIG.decoder.gltfPreloadFrameCount + 1; i++) {
      this.preloadUrl(i);
    }
  }

  private preloadUrl(index: number) {
    const self = this;
    fetch(this.urls[index]).then(
      response => response.arrayBuffer()
    ).then(arrayBuffer => {
      self.loader.parse(
        arrayBuffer, '',
        function(gltf: GltfData) {self.addGltfScene(index, gltf)}
      )
    })
  }

  private openFiles(files: FileList) {
    this.loadType = LoadType.FILE;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const frameNumber = Number(file.name.split('.')[0]);
      this.files[frameNumber] = file;
    }

    for (let i = 0; i < CONFIG.decoder.gltfPreloadFrameCount + 1; i++) {
      this.preloadFile(i);
    }
  }

  private preloadFile(index: number) {
    const reader = new FileReader();
    const self = this;
    reader.onload = function() {
      self.loader.parse(
        reader.result, '',
        function(gltf: GltfData) {self.addGltfScene(index, gltf)}
      )
    };
    reader.readAsArrayBuffer(this.files[index]);
  }

  private preloadFrame(index: number) {
    if (this.loadType === LoadType.FILE) {
      this.preloadFile(index);
    } else if (this.loadType === LoadType.URL) {
      this.preloadUrl(index);
    } else {
      console.error('Wrong loadType: ', this.loadType);
    }
  }

  private addGltfScene(index: number, gltf: GltfData) {
    const mesh = gltf.scene.children[0] as THREE.Mesh;

    if (this.material) {
      const old_material = mesh.material as THREE.Material;
      mesh.material = this.material;
      old_material.dispose();
    }

    mesh.geometry.computeVertexNormals();

    this.gltfScenes[index] = gltf.scene;

    // Check if preloading
    if (!this.isReady) {
      this.initialPreloadedFrameCount -= 1;

      if (this.onLoading) {
        const progress = (
          CONFIG.decoder.gltfPreloadFrameCount -
          this.initialPreloadedFrameCount
        ) / CONFIG.decoder.gltfPreloadFrameCount;

        this.onLoading(progress);
      }

      if (this.initialPreloadedFrameCount === 0) {
        this.isReady = true;
        console.log('Ready.');
        this.openResolve('ready');
        // this.playNextFrame();
      }
    }
  }

  override isNextFrameAvailable() {
    const nextMeshIndex = nextWithLoop(this.currentMeshIndex, this.frameCount);
    return this.gltfScenes[nextMeshIndex] != null;
  }

  playNextFrame(currentFrame: number) {
    // if (currentFrame >= 1) return;
    if (currentFrame === -1) {
      console.warn('nono');
      return;
    }
    if (!this.isReady) {
      console.warn('Not ready yet.');
      return;
    }

    if (!this.isNextFrameAvailable()) {
      console.warn('BUFFFFFFFFFFFFFFERRRRRING');
      if (!this.buffering) {
        (document.getElementById('video-player') as HTMLMediaElement).pause();
        this.buffering = true;
      }
      setTimeout(() => this.playNextFrame(currentFrame), 1000);
      return;
    }

    const nextMeshIndex = nextWithLoop(this.currentMeshIndex, this.frameCount);

    // check last buffer
    let lastGltfScene = undefined;
    if (currentFrame !== undefined && this.currentMeshIndex !== -1) {
      lastGltfScene = this.gltfScenes[this.currentMeshIndex];
      this.gltfScenes[this.currentMeshIndex] = null;
    }

    // current buffer
    this.currentMeshIndex = nextMeshIndex;
    const currentGltfScene = this.gltfScenes[this.currentMeshIndex];

    console.debug('Gltf frame: ', this.currentMeshIndex);
    if (currentFrame === undefined || currentFrame === this.currentMeshIndex) {
      (this.onNext as MeshOnNextCallback)(lastGltfScene, currentGltfScene);
    }

    // preload
    this.preloadFrame((this.currentMeshIndex + CONFIG.decoder.gltfPreloadFrameCount) % this.frameCount);

    // currentMeshIndex
    if (currentFrame !== undefined && currentFrame !== this.currentMeshIndex) {
      console.log('again'!);
      this.playNextFrame(currentFrame);
    } else if (this.buffering) {
      (document.getElementById('video-player') as HTMLMediaElement).play();
      this.buffering = false;
    }
  }
}
