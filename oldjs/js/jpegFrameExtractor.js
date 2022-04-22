PRELOAD_FRAME_COUNT = 30;


class JpegFrameExtractor {
  constructor() {
    this.currentBitmapIndex = -1;
    this.initialPreloadedFrameCount = PRELOAD_FRAME_COUNT;

    this.urls = []
    this.bitmaps = []

    this.onNext = null;
    this.onLoading = null;

    this.isReady = false;

    this.loadResolve = null;
  }

  importUrls(urls) {
    const self = this;
    return new Promise((resolve, _) => {
      self.loadResolve = resolve;
      this.urls = urls;

      for (let i = 0; i < PRELOAD_FRAME_COUNT + 1; i++) {
        self.preloadBitmap(i);
      }
    });
  }

  preloadBitmap(index) {
    const self = this;
    fetch(this.urls[index]).then(
      response => response.arrayBuffer()
    ).then(arrayBuffer => {
      const blob = new Blob([arrayBuffer], {type: 'image/jpeg'});
      createImageBitmap(
        blob,
        {
          premultiplyAlpha: 'none',
          colorSpaceConversion: 'none',
        }
      ).then(bitmap => self.addBitmap(index, bitmap));

      if (this.onLoading) this.onLoading(
        (PRELOAD_FRAME_COUNT - self.initialPreloadedFrameCount) / PRELOAD_FRAME_COUNT
      )
    })


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
    const nextBitmapIndex = (this.currentBitmapIndex + 1) % this.urls.length;
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
    const nextBitmapIndex = (this.currentBitmapIndex + 1) % this.urls.length;

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

    this.preloadBitmap((this.currentBitmapIndex + 1) % this.urls.length);
  }
}
