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
    };
  }

  static get instance(): Config {
    return this._instance || (this._instance = new this());
  }

  applyMetadata(metadata: ConfigMetadata) {
    const metadataKeys = Object.keys(metadata);
    const configKeys = ['engine', 'texture', 'mesh', 'player'];
    type ConfigKey = keyof Config;

    metadataKeys.forEach(metadataKey => {
      configKeys.forEach(configKey => {
        const subConfig = this[configKey as ConfigKey];
        const parameters = Object.keys(subConfig);
        if (parameters.includes(metadataKey)) {
          // @ts-ignore
          subConfig[metadataKey] = metadata[metadataKey];
          // @ts-ignore
          console.log('Apply metadata:', configKey, '/', metadataKey, '->', metadata[metadataKey]);
        }
      });
    });
  }
}


const CONFIG = Config.instance;
export default CONFIG;
