PRELOAD_FRAME_COUNT = 30;


class JpegFrameExtractor {
  constructor() {
    this.currentBitmapIndex = -1;
    this.initialPreloadedFrameCount = PRELOAD_FRAME_COUNT;

    this.blobs = []
    this.bitmaps = []

    this.onNext = null;
    this.onLoading = null;

    this.isReady = false;

    this.loadedCount = 0;
    this.loadResolve = null;
  }

  importUrls(urls) {
    const self = this;
    return new Promise((resolve, _) => {
      self.loadResolve = resolve;
      this.blobs = new Array(urls.length);

      let fetches = []
      urls.forEach((url, index) => {
        const fetchWork = fetch(url).then(
          response => response.arrayBuffer()
        ).then(arrayBuffer => {
          this.blobs[index] = new Blob([arrayBuffer], {type: 'image/jpeg'});
          this.loadedCount += 1;
          if (this.onLoading) this.onLoading(this.loadedCount / this.blobs.length)
        })
        fetches.push(fetchWork);
      });

      Promise.all(fetches).then(() => {
        for (let i = 0; i < PRELOAD_FRAME_COUNT + 1; i++) {
          self.preloadBitmap(i);
        }
      });
    });
  }

  preloadBitmap(index) {
    const self = this;
    createImageBitmap(
      this.blobs[index],
      {
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none',
      }
    ).then(bitmap => self.addBitmap(index, bitmap));
  }

  addBitmap(index, bitmap) {
    this.bitmaps[index] = bitmap;

    if (!this.isReady) {
      this.initialPreloadedFrameCount -= 1;
      if (this.initialPreloadedFrameCount === 0) {
        this.isReady = true;
        console.log('Ready');
        this.loadResolve('ready');
      }
    }
  }

  checkNextFrameAvailability() {
    const nextBitmapIndex = (this.currentBitmapIndex + 1) % this.blobs.length;
    return this.bitmaps[nextBitmapIndex];
  }

  nextFrame() {
    if (!this.isReady) {
      console.warn('Not ready yet.');
      return;
    }

    if (!this.checkNextFrameAvailability()) {
      console.warn('bitmap not found');
      this.isReady = false;
      return;
    }
    const nextBitmapIndex = (this.currentBitmapIndex + 1) % this.blobs.length;

    // check last buffer
    if (this.currentBitmapIndex !== -1) {
      this.bitmaps[this.currentBitmapIndex] = null;
    }

    // current buffer
    this.currentBitmapIndex = nextBitmapIndex;
    console.debug('Jpg frame: ', this.currentBitmapIndex);
    const bitmap = this.bitmaps[this.currentBitmapIndex];
    if (this.onNext) this.onNext(bitmap);
    bitmap.close();

    this.preloadBitmap((this.currentBitmapIndex + 1) % this.blobs.length);
  }
}
