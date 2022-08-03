class Config {
  private static _instance: Config;
  engine: {
    cameraFOV: number;
    cameraDistance: number;
    cameraHeightOffset: number;
    backgroundColor: number;
  };
  texture: {
    fps: number;
  };
  mesh: {
    dracoPath: string;
    bufferFrameCount: number;
  }

  private constructor() {
    this.engine = {
      cameraFOV: 60,
      cameraDistance: 0.8,
      cameraHeightOffset: -0.15,
      backgroundColor: 0x152126
    };
    this.texture = {
      fps: 30
    };
    this.mesh = {
      dracoPath: '/draco/',
      bufferFrameCount: 100
    }
  }

  static get instance(): Config {
    return this._instance || (this._instance = new this());
  }
}


const CONFIG = Config.instance;
export default CONFIG;
