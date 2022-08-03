declare interface VideoFrameMetadata {
  presentationTime: DOMHighResTimeStamp;
  expectedDisplayTime: DOMHighResTimeStamp;
  width: number;
  height: number;
  mediaTime: number;
  presentedFrames: number;
  processingDuration?: number;
  captureTime?: DOMHighResTimeStamp;
  receiveTime?: DOMHighResTimeStamp;
  rtpTimestamp?: number;
}

declare type VideoFrameRequestCallbackId = number;

declare interface HTMLVideoElement extends HTMLMediaElement {
  requestVideoFrameCallback(callback: (now: DOMHighResTimeStamp, metadata: VideoFrameMetadata) => any): VideoFrameRequestCallbackId;
  cancelVideoFrameCallback(handle: VideoFrameRequestCallbackId): void;
}
