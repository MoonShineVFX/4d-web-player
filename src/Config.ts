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
    bufferWhileWaitingCount: number;
    bufferWhilePlayingCount: number;
  }
  player: {
    fps: number;
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
      bufferWhileWaitingCount: 100,
      bufferWhilePlayingCount: 1
    };
    this.player = {
      fps: 30
    }
  }

  static get instance(): Config {
    return this._instance || (this._instance = new this());
  }
}


const CONFIG = Config.instance;
export default CONFIG;
