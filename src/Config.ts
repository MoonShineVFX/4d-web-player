export interface ConfigMetadata {
  endFrame: number,
  meshFrameOffset: number;
}


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
    meshFrameOffset: number;
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
      dracoPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.3/', // '/draco/' for local
      bufferWhileWaitingCount: 100,
      bufferWhilePlayingCount: 1
    };
    this.player = {
      fps: 30,
      meshFrameOffset: -1
    }
  }

  static get instance(): Config {
    return this._instance || (this._instance = new this());
  }

  applyMetadata(metadata: ConfigMetadata) {
    if (metadata.meshFrameOffset) this.player.meshFrameOffset = metadata.meshFrameOffset;
  }
}


const CONFIG = Config.instance;
export default CONFIG;
