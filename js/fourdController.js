// DEFINE
const FRAME_DURATION = 1000 / 30;
const DELAY_DURATION = 500;


class FourdController {
  constructor() {
    this.threeManager = new ThreeEngine();
    this.mp4Extractor = new Mp4FrameExtractor();
    this.gltfExtractor = new GltfFrameExtractor(this.threeManager.uniMaterial);

    this.readyQueue = [];

    this.isPlaying = false;
    this.lastTimeStamp = null;
    this.deltaTime = 0;

    this.initialize();
  }

  initialize() {
    // Binding
    this.mp4Extractor.onNext = frame => this.threeManager.updateRawTextureFromVideoFrame(frame);
    this.gltfExtractor.onNext = (oldGltf, newGltf) => this.threeManager.replaceGltf(oldGltf, newGltf);

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

  loadGltf(files, urls) {
    let gltfLoading;
    if (files) {
      gltfLoading = this.gltfExtractor.importFiles(files);
    } else if (urls) {
      gltfLoading = this.gltfExtractor.importUrls(urls);
    }
    this.readyQueue.push(gltfLoading);

    // Auto start when all components loaded, must move to better position
    Promise.all(this.readyQueue).then(() => this.play());
  }

  loadTextureFromMp4(mp4Url) {
    const mp4Loading = fetch(mp4Url).then(
      response => response.arrayBuffer()
    ).then(
      arrayBuffer => this.mp4Extractor.loadArrayBuffer(arrayBuffer)
    );
    this.readyQueue.push(mp4Loading);
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

    if (this.deltaTime < FRAME_DURATION) return;
    this.deltaTime %= FRAME_DURATION;

    if (!this.mp4Extractor.checkNextFrameAvailability() ||
      !this.gltfExtractor.checkNextFrameAvailability()) {
      this.deltaTime = -DELAY_DURATION;
      return
    }

    this.mp4Extractor.nextFrame();
    this.gltfExtractor.nextFrame();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.tickNextFrame();
    this.threeManager.render();
  }
}
