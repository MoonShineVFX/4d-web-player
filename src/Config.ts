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
    modelPositionOffset: number[];
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

  isSafari: boolean;
  isWebview: boolean;

  private constructor() {
    this.engine = {
      cameraFOV: 60,
      cameraDistance: 0.8,
      cameraHeightOffset: 0.0,
      modelPositionOffset: [0.0, 0.0, 0.0],
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

    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // User agent detection
    const standalone = Object.hasOwn(window.navigator, 'standalone');
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipod|ipad/.test(userAgent);
    const inApp = /line/.test(userAgent);

    this.isWebview = false;
    if (ios) {
      if (inApp || (!standalone && !this.isSafari)) {
        this.isWebview = true;
      }
    } else {
      if (userAgent.includes('wv')) {
        this.isWebview = true;
      } else {
        // Chrome
      }
    }
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
