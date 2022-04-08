PRELOAD_FRAME_COUNT = 30;
DRACO_DECODER_PATH = '/draco/';


class GltfFrameExtractor {
  constructor(material) {
    this.currentMeshIndex = -1;
    this.initialPreloadedFrameCount = PRELOAD_FRAME_COUNT + 1;

    this.material = material;

    this.gltfs = [];
    this.files = [];

    this.isReady = false;
    this.onReady = null;
    this.onNext = null;

    // Three.js
    this.loader = new THREE.GLTFLoader();
    this.dracoLoader = new THREE.DRACOLoader();
    this.dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  importFiles(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const frameNumber = Number(file.name.split('.')[0]);
      this.files[frameNumber] = file;
    }

    for (let i = 0; i < this.initialPreloadedFrameCount; i++) {
      this.preloadFile(i);
    }
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
    reader.readAsArrayBuffer(this.files[index]);
  }

  addGltf(index, gltf) {
    const mesh = gltf.scene.children[0];
    const old_material = mesh.material;
    mesh.material = this.material;
    old_material.dispose();
    mesh.geometry.computeVertexNormals(true);

    this.gltfs[index] = gltf.scene;
    this.initialPreloadedFrameCount -= 1;
    if (this.initialPreloadedFrameCount === 0) {
      this.isReady = true;
      console.log('Ready.');
      if (this.onReady) this.onReady();
    }
  }

  checkNextFrameAvailability() {
    const nextMeshIndex = (this.currentMeshIndex + 1) % this.files.length;
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
    let nextMeshIndex = (this.currentMeshIndex + 1) % this.files.length;

    // check last buffer
    let lastGltf = undefined;
    if (this.currentMeshIndex !== -1) {
      lastGltf = this.gltfs[this.currentMeshIndex];
      this.gltfs[this.currentMeshIndex] = null;
    }

    // current buffer
    this.currentMeshIndex = nextMeshIndex;
    const currentGltf = this.gltfs[this.currentMeshIndex];

    console.debug('Geo frame: ', this.currentMeshIndex);
    if (this.onNext) this.onNext(lastGltf, currentGltf);

    // preload
    this.preloadFile((this.currentMeshIndex + PRELOAD_FRAME_COUNT) % this.files.length);
  }
}
