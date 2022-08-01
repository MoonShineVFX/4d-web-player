interface PlayerConfig {
  frameDuration: number;
  delayDuration: number;
}
interface DecoderConfig {
  gltfPreloadFrameCount: number;
  dracoPath: string;
  mp4PreloadFrameCount: number;
  jpegPreloadFrameCount: number;
}
interface EngineConfig {
  cameraFOV: number;
  cameraDistance: number;
  cameraHeightOffset: number;
  backgroundColor: number;
  width: number;
  height: number;
}


class Config {
  private static _instance: Config;
  player: PlayerConfig;
  decoder: DecoderConfig;
  engine: EngineConfig;

  private constructor() {
    this.player = {
      frameDuration: 1000 / 30,  // 30fps
      delayDuration: 500 // 500ms
    }
    this.decoder = {
      gltfPreloadFrameCount: 30,
      dracoPath: '/draco/',
      mp4PreloadFrameCount: 60,
      jpegPreloadFrameCount: 30
    }
    this.engine = {
      cameraFOV: 60,
      cameraDistance: 0.8,
      cameraHeightOffset: -0.15,
      backgroundColor: 0x152126,
      width: window.innerWidth,
      height: 540
    }
  }

  static get instance(): Config {
    return this._instance || (this._instance = new this());
  }
}


const CONFIG = Config.instance;
export default CONFIG;
