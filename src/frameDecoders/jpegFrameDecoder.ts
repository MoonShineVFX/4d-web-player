import CONFIG from '../config';
import { nextWithLoop } from '../utility';

import {OnLoadingCallback, TextureFrameDecoder, TextureOnNextCallback} from './defines';


export default class JpegFrameDecoder extends TextureFrameDecoder {
  private currentBitmapIndex: number;
  private initialPreloadedFrameCount: number;

  private urls: string[];
  private readonly bitmaps: ImageBitmap[];

  constructor(
    onNext: TextureOnNextCallback,
    onLoading: OnLoadingCallback | null
  ) {
    super();
    this.currentBitmapIndex = -1;
    this.initialPreloadedFrameCount = CONFIG.decoder.jpegPreloadFrameCount;

    this.urls = []
    this.bitmaps = []

    this.isReady = false;

    this.onNext = onNext;
    this.onLoading = onLoading;

    this.openResolve = null;
  }

  open(source: string[]): Promise<string>
  override open(source: any): Promise<string> {
    const self = this;
    return new Promise((resolve, reject) => {
      if (!Array.isArray(source) || typeof source[0] !== 'string') {
        reject('Wrong source!');
        return;
      }

      self.openResolve = resolve;
      this.urls = source as string[];
      this.frameCount = this.urls.length;

      for (let i = 0; i < CONFIG.decoder.jpegPreloadFrameCount + 1; i++) {
        self.preloadBitmap(i);
      }
    });
  }

  preloadBitmap(index: number) {
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
    })


  }

  addBitmap(index: number, bitmap: ImageBitmap) {
    this.bitmaps[index] = bitmap;

    if (!this.isReady) {
      this.initialPreloadedFrameCount -= 1;

      if (this.onLoading) {
        const progress = (
          CONFIG.decoder.jpegPreloadFrameCount -
          this.initialPreloadedFrameCount
        ) / CONFIG.decoder.jpegPreloadFrameCount;

        this.onLoading(progress);
      }

      if (this.initialPreloadedFrameCount === 0) {
        this.isReady = true;
        console.log('Ready');
        this.openResolve('ready');
      }
    }
  }

  override isNextFrameAvailable() {
    const nextBitmapIndex = nextWithLoop(this.currentBitmapIndex, this.frameCount);
    return this.bitmaps[nextBitmapIndex] != null;
  }

  override playNextFrame() {
    if (!this.isReady) {
      console.warn('Not ready yet.');
      return;
    }

    if (!this.isNextFrameAvailable()) {
      console.warn('bitmap not found');
      this.isReady = false;
      return;
    }
    const nextBitmapIndex = nextWithLoop(this.currentBitmapIndex, this.frameCount);

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

    this.preloadBitmap(nextWithLoop(this.currentBitmapIndex, this.frameCount));
  }
}
