// DEFINE
const FRAME_DURATION = 1000 / 30;
const DELAY_DURATION = 500;


// initial
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x152126);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
const renderer = new THREE.WebGL1Renderer({antialias: true});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.prepend(renderer.domElement);
camera.position.y -= 0.15;
camera.position.z = 0.5;


// mp4 frame extractor
const mp4Extractor = new Mp4FrameExtractor();
fetch('texture_2k.mp4').then(
  response => response.arrayBuffer()
).then(
  arrayBuffer => {
    mp4Extractor.loadArrayBuffer(arrayBuffer);
  }
);


// create texture for mp4
const gl = renderer.domElement.getContext('webgl');

const texture = new THREE.Texture();
texture.realGlTexture = gl.createTexture();
texture.isInitialize = false;
texture.encoding = THREE.sRGBEncoding;
texture.flipY = false;
renderer.properties.get(texture).__webglTexture = texture.realGlTexture;

const material = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture});


mp4Extractor.onNext = frame => {
  gl.bindTexture(gl.TEXTURE_2D, texture.realGlTexture);
  if (!texture.isInitialize) {
    texture.isInitialize = true;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);
  }
};


// geo
const gltfExtractor = new GltfFrameExtractor(material);
gltfExtractor.onNext = (lastGltf, currentGltf) => {
  if (lastGltf) {
    scene.remove(lastGltf);
    lastGltf.traverse(function(obj) {
      if(obj.geometry)
        obj.geometry.dispose();
      if(obj.mesh)
        obj.mesh.dispose();
      // if(obj.material)
      //   obj.material.dispose();
      // if(obj.texture)
      //   obj.texture.dispose();
    });
  }

  scene.add(currentGltf);
}

// render
let playing = false;
let lastTimeStamp = null;
let deltaTime = 0;
function startPlay() {
  if (!playing) return;
  if (!lastTimeStamp) {
    lastTimeStamp = performance.now();
    return;
  }
  const currentTimeStamp = performance.now();
  deltaTime += currentTimeStamp - lastTimeStamp;
  lastTimeStamp = currentTimeStamp;

  if (deltaTime < FRAME_DURATION) return;
  deltaTime -= FRAME_DURATION;

  if (!mp4Extractor.checkNextFrameAvailability() ||
      !gltfExtractor.checkNextFrameAvailability()) {
    deltaTime = -DELAY_DURATION;
    return
  }

  mp4Extractor.nextFrame();
  gltfExtractor.nextFrame();
}


function animate() {
  requestAnimationFrame(animate);
  startPlay();
  renderer.render(scene, camera);
}
animate();


document.addEventListener('keydown', event => {
  if (event.code === 'Space') {
    playing = !playing;
    event.preventDefault();
  }
})
