// DEFINE
const FRAME_DURATION = 1000 / 30;
const DELAY_DURATION = 500;


class TextureType {
  static MP4 = 'mp4';
  static JPG = 'jpg';
}


class FourdController {
  constructor(textureType) {
    this.threeEngine = new ThreeEngine();
    this.gltfExtractor = new GltfFrameExtractor(this.threeEngine.uniMaterial);

    this.textureType = textureType;
    this.textureExtractor = undefined;
    if (textureType === TextureType.MP4) {
      this.textureExtractor = new Mp4FrameExtractor();
    } else if (textureType === TextureType.JPG) {
      this.textureExtractor = new JpegFrameExtractor();
    }

    this.readyQueue = [];

    this.isPlaying = false;
    this.lastTimeStamp = null;
    this.deltaTime = 0;

    this.initialize();
  }

  initialize() {
    // Binding
    if (this.textureType === TextureType.MP4) {
      this.textureExtractor.onNext = frame => this.threeEngine.updateRawTextureFromVideoFrame(frame);
    } else if (this.textureType === TextureType.JPG) {
      this.textureExtractor.onNext = texture => this.threeEngine.updateTexture(texture);
    }

    this.gltfExtractor.onNext = (oldGltf, newGltf) => this.threeEngine.replaceGltf(oldGltf, newGltf);

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

  loadTextureFromUrl(url) {
    let textureLoading;
    if (this.textureType === TextureType.MP4) {
      textureLoading = this.textureExtractor.loadArrayBufferFromURL(url);
    } else if (this.textureType === TextureType.JPG) {
      textureLoading = this.textureExtractor.importUrls(url);
    }
    this.readyQueue.push(textureLoading);
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

    if (!this.textureExtractor.checkNextFrameAvailability() ||
      !this.gltfExtractor.checkNextFrameAvailability()) {
      this.deltaTime = -DELAY_DURATION;
      return
    }

    this.textureExtractor.nextFrame();
    this.gltfExtractor.nextFrame();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.tickNextFrame();
    this.threeEngine.render();
  }
}
