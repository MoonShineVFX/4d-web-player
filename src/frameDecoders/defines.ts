import * as THREE from 'three';


export type MeshOnNextCallback = (oldGroup: THREE.Group, newGroup: THREE.Group) => void;

export type TextureOnNextCallback = (imageData: TexImageSource | VideoFrame) => void;

type NextCallback = MeshOnNextCallback | TextureOnNextCallback;

export type OnLoadingCallback = (progressPercent: number) => void;


export class FrameDecoder {
  protected frameCount: number;

  protected onLoading: OnLoadingCallback | null;
  protected onNext: NextCallback;

  protected openResolve: (value: string) => void | null;
  protected openReject: (value: string) => void | null;

  isNextFrameAvailable(): boolean { return undefined };
  playNextFrame() {};
  open(source: any): Promise<string> { return undefined };
}

export class MeshFrameDecoder extends FrameDecoder {
}

export class TextureFrameDecoder extends FrameDecoder {
  protected onNext: TextureOnNextCallback;
}
