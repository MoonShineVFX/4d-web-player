// initial
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
const renderer = new THREE.WebGL1Renderer({antialias: true});
renderer.outputEncoding = THREE.sRGBEncoding;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.y -= 0.15;
camera.position.z = 0.5;


// light
const amLight = new THREE.AmbientLight(0xFFFFFF, 0.1);
const ptLight = new THREE.PointLight(0xFFFFFF, 1, 100);
ptLight.position.set(1, 1, 0);
scene.add(amLight);
scene.add(ptLight);


// video material
const video = document.getElementById( 'import-video' );
video.playbackRate = 1;
const texture = new THREE.VideoTexture(video);
texture.encoding = THREE.sRGBEncoding;
texture.flipY = false;
const material = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture});


// draco
const loader = new THREE.GLTFLoader();
const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
loader.setDRACOLoader(dracoLoader);


// player
class FourdPlayer {
  constructor() {
    this.currentMeshIndex = -1;
    this.gltfs = [];
    this.preloadFrameThreshold = 30;
    this.preloadFrameCount = this.preloadFrameThreshold + 1;
    this.active = false;
    this.files = [];
  }

  importFiles(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const frameNumber = Number(file.name.split('.')[0]);
      this.files[frameNumber] = file;
    }

    for (let i = 0; i < this.preloadFrameCount; i++) {
      this.preloadFile(i);
    }
  }

  preloadFile(index) {
    const reader = new FileReader();
    const thisPlayer = this;
    reader.onload = function() {
      loader.parse(
        reader.result, '',
        function(gltf) {thisPlayer.addGltf(index, gltf)}
      )
    };
    reader.readAsArrayBuffer(this.files[index]);
  }

  addGltf(index, gltf) {
    const mesh = gltf.scene.children[0];
    const old_material = mesh.material;
    mesh.material = material;
    // mesh.material.color.setRGB(1, 1, 1);
    // mesh.material.roughness = 0.4;
    // mesh.material.flatShading = false;
    old_material.dispose();
    mesh.geometry.computeVertexNormals(true);
    // mesh.material.needsUpdate = true;

    this.gltfs[index] = gltf.scene;
    this.preloadFrameCount -= 1;
    if (this.preloadFrameCount === 0) {
      this.active = true;
      superLoop(0);
      // video.play();
    }
  }

  tick(frame) {
    if (!this.active) return;
    // check next buffer loaded
    // const nextMeshIndex = (this.currentMeshIndex + 1) % this.files.length;
    // const nextMeshIndex = Math.ceil((videoTime - 1/30/5) * 30) % this.files.length;
    const nextMeshIndex = frame;
    if (nextMeshIndex === this.currentMeshIndex) {
      return;
    }
    // console.debug(nextMeshIndex);
    if (!this.gltfs[nextMeshIndex]) {
      // this.deltaFrame -= 1;
      console.warn('not match: ', nextMeshIndex);
      video.pause();
      this.active = false
      return;
    }

    // check last buffer
    let lastGltf = undefined;
    if (this.currentMeshIndex !== -1) {
      lastGltf = this.gltfs[this.currentMeshIndex];
    }
    if (lastGltf) {
      scene.remove(lastGltf);
      lastGltf.traverse(function(obj) {
        if(obj.geometry)
          obj.geometry.dispose();
        // if(obj.material)
        //   obj.material.dispose();
        if(obj.mesh)
          obj.mesh.dispose();
        // if(obj.texture)
        //   obj.texture.dispose();
      });
      this.gltfs[this.currentMeshIndex] = null;
    }

    // add this buffer
    video.currentTime = 1 / 30 * frame + 0.001;
    texture.needsUpdate = true;
    this.currentMeshIndex = nextMeshIndex;
    scene.add(this.gltfs[this.currentMeshIndex]);

    // preload
    this.preloadFile((this.currentMeshIndex + this.preloadFrameThreshold) % this.files.length);
    }
}
const player = new FourdPlayer();


// render
function superLoop(frameNumber) {
  player.tick(frameNumber);
  setTimeout(() => this.superLoop(frameNumber += 1), 33.333);
}
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
