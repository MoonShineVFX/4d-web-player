import FourdTexture from '../FourdTexture';
import FourdEngine from '../FourdEngine';
import FourdMesh from '../FourdMesh';
import {pad} from '../utility';
import './dev.css';


let meshUrls = []
for (let i = 0; i < 1038; i++) {
  meshUrls.push(`/resource/mi/gltf_mini_drc/${pad(i, 4)}.glb`);
}

const engine = new FourdEngine('fourd-web-viewport');
const mesh = new FourdMesh(engine.uniMaterial, meshUrls);
let texture: FourdTexture;
let isWaiting = false;
let waitingHandle: NodeJS.Timeout = undefined;

const fps = 30
const threshold = 1000/fps;
let then: number = undefined;

const animate = () => {
  requestAnimationFrame(() => animate());
  const now = Date.now();
  if (!then) {
    then = now;
    return;
  }
  const delta = now - then;
  if (delta > threshold) {
    then = now - (delta % threshold);
    engine.render();
  }
}

const waitForMeshBuffering = (frameNumber: number) => {
  console.debug('waiting mesh buffering...');
  if (mesh.isBufferedEnough(frameNumber)) {
    waitingHandle = undefined;
    isWaiting = false;
    texture.decode();
    console.log('enough!');
    return;
  }
  waitingHandle = setTimeout(() => waitForMeshBuffering(frameNumber), 1000);
}

setTimeout(() => {
    texture = new FourdTexture(
      'fourd-web-texture',
      '/resource/mi/texture_2k.mp4',
      (frameNumber, videoDom) => {
        if (isWaiting) return false;
        const frameMesh = mesh.playFrame(frameNumber);
        if (!frameMesh) {
          isWaiting = true;
          if (waitingHandle) {
            clearTimeout(waitingHandle);
          }
          waitingHandle = setTimeout(() => waitForMeshBuffering(frameNumber), 1000);
          return false;
        }
        engine.updateRawTexture(videoDom);
        engine.updateMesh(frameMesh);
        return true
      }
    );
    animate();
  }, 1000
)

