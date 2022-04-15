class JpegFrameExtractor {
  constructor() {
    this.currentTextureIndex = -1;

    this.textures = []

    this.onNext = null;
    this.onLoading = null;

    this.isReady = false;

    this.loadedCount = 0;
    this.loadResolve = null;

    // Three.js
    this.loader = new THREE.TextureLoader();
  }

  importUrls(urls) {
    const self = this;
    return new Promise((resolve, _) => {
      self.loadResolve = resolve;
      this.textures = new Array(urls.length);

      urls.forEach((url, index) => {
        self.loader.load(
          url,
          texture => self.addTexture(index, texture)
        )
      });
    });
  }

  checkNextFrameAvailability() {
    return this.isReady;
  }

  addTexture(index, texture) {
    texture.flipY = false;
    this.textures[index] = texture;
    this.loadedCount += 1;
    if (this.onLoading) this.onLoading(this.loadedCount / this.textures.length);
    if (this.loadedCount === this.textures.length) {
      this.isReady = true;
      this.loadResolve('ready');
    }
  }

  nextFrame() {
    this.currentTextureIndex = (this.currentTextureIndex + 1) % this.textures.length;
    console.debug('Jpg frame: ', this.currentTextureIndex);
    if (this.onNext) this.onNext(this.textures[this.currentTextureIndex]);
  }
}
