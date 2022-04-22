PRELOAD_FRAME_COUNT = 30;
DRACO_DECODER_PATH = '/draco/';


class GltfFrameExtractor {
  constructor(material = null) {
    this.currentMeshIndex = -1;
    this.initialPreloadedFrameCount = PRELOAD_FRAME_COUNT;

    this.material = material;

    this.gltfs = [];
    this.fileAddress = [];
    this.loadType = null;  // file or url

    this.isReady = false;
    this.onNext = null;
    this.onLoading = null;

    this.loadResolve = null;

    // Three.js
    this.loader = new THREE.GLTFLoader();
    this.dracoLoader = new THREE.DRACOLoader();
    this.dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  importUrls(urls) {
    this.loadType = 'url';
    const self = this;
    return new Promise((resolve, _) => {
      self.loadResolve = resolve;
      self.fileAddress = urls;

      for (let i = 0; i < PRELOAD_FRAME_COUNT + 1; i++) {
        self.preloadUrl(i);
      }
    });
  }

  preloadUrl(index) {
    const self = this;
    fetch(this.fileAddress[index]).then(
      response => response.arrayBuffer()
    ).then(arrayBuffer => {
      self.loader.parse(
        arrayBuffer, '',
        function(gltf) {self.addGltf(index, gltf)}
      )
    })
  }

  importFiles(files) {
    this.loadType = 'file';
    const self = this;
    return new Promise((resolve, _) => {
      self.loadResolve = resolve;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const frameNumber = Number(file.name.split('.')[0]);
        self.fileAddress[frameNumber] = file;
      }

      for (let i = 0; i < PRELOAD_FRAME_COUNT + 1; i++) {
        self.preloadFile(i);
      }
    });
  }

  preloadFile(index) {
    const reader = new FileReader();
    const self = this;
    reader.onload = function() {
      self.loader.parse(
        reader.result, '',
        function(gltf) {self.addGltf(index, gltf)}
      )
    };
    reader.readAsArrayBuffer(this.fileAddress[index]);
  }

  preloadFrame(index) {
    if (this.loadType === 'file') {
      this.preloadFile(index);
    } else if (this.loadType === 'url') {
      this.preloadUrl(index);
    } else {
      console.error('Wrong loadType: ', this.loadType);
    }
  }

  addGltf(index, gltf) {
    const mesh = gltf.scene.children[0];
    const old_material = mesh.material;
    mesh.material = this.material;
    old_material.dispose();
    mesh.geometry.computeVertexNormals(true);

    this.gltfs[index] = gltf.scene;

    if (!this.isReady) {
      this.initialPreloadedFrameCount -= 1;
      if (this.onLoading) {
        const progress = (PRELOAD_FRAME_COUNT - this.initialPreloadedFrameCount) / PRELOAD_FRAME_COUNT;
        this.onLoading(progress);
      }
      if (this.initialPreloadedFrameCount === 0) {
        this.isReady = true;
        console.log('Ready.');
        this.loadResolve('ready');
      }
    }
  }

  checkNextFrameAvailability() {
    const nextMeshIndex = (this.currentMeshIndex + 1) % this.fileAddress.length;
    return this.gltfs[nextMeshIndex];
  }

  nextFrame() {
    if (!this.isReady) {
      console.warn('Not ready yet.');
      return;
    }

    if (!this.checkNextFrameAvailability()) {
      console.warn('mesh not found');
      this.isReady = false;
      return;
    }
    const nextMeshIndex = (this.currentMeshIndex + 1) % this.fileAddress.length;

    // check last buffer
    let lastGltf = undefined;
    if (this.currentMeshIndex !== -1) {
      lastGltf = this.gltfs[this.currentMeshIndex];
      this.gltfs[this.currentMeshIndex] = null;
    }

    // current buffer
    this.currentMeshIndex = nextMeshIndex;
    const currentGltf = this.gltfs[this.currentMeshIndex];

    console.debug('Gltf frame: ', this.currentMeshIndex);
    if (this.onNext) this.onNext(lastGltf, currentGltf);

    // preload
    this.preloadFrame((this.currentMeshIndex + PRELOAD_FRAME_COUNT) % this.fileAddress.length);
  }
}
