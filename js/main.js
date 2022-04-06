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
    this.preloadFrameCount = this.preloadFrameThreshold;
    this.active = false;
    this.frameDuration = 2;
    this.deltaFrame = this.frameDuration;
    this.perfTime = 0;
    this.files = [];
  }

  importFiles(files) {
    this.perfTime = performance.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const frameNumber = Number(file.name.split('.')[0]);
      this.files[frameNumber] = file;
    }

    for (let i = 0; i < this.preloadFrameThreshold; i++) {
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
    mesh.material.color.setRGB(1, 1, 1);
    mesh.material.roughness = 0.4;
    mesh.material.flatShading = false;
    mesh.geometry.computeVertexNormals(true);
    mesh.material.needsUpdate = true;

    this.gltfs[index] = gltf.scene;
    this.preloadFrameCount -= 1;
    if (this.preloadFrameCount === 0) {
      this.active = true;
      console.log(performance.now() - this.perfTime);
    }
  }

  tick() {
    if (!this.active) return;
    this.deltaFrame += 1;
    if (this.deltaFrame >= this.frameDuration) {
      // check next buffer loaded
      const nextMeshIndex = (this.currentMeshIndex + 1) % this.files.length;
      if (!this.gltfs[nextMeshIndex]) {
        this.deltaFrame -= 1;
        return;
      }

      // remove last buffer
      this.deltaFrame = 0;
      let lastGltf = undefined;
      if (this.currentMeshIndex !== -1) {
        lastGltf = this.gltfs[this.currentMeshIndex];
      }
      if (lastGltf) {
        scene.remove(lastGltf);
        lastGltf.traverse(function(obj) {
          if(obj.geometry)
            obj.geometry.dispose();
          if(obj.material)
            obj.material.dispose();
          if(obj.mesh)
            obj.mesh.dispose();
          if(obj.texture)
            obj.texture.dispose();
        });
        this.gltfs[this.currentMeshIndex] = null;
      }

      // add this buffer
      this.currentMeshIndex = nextMeshIndex;
      scene.add(this.gltfs[this.currentMeshIndex]);

      // preload
      this.preloadFile((this.currentMeshIndex + this.preloadFrameThreshold) % this.files.length);
    }
  }
}
const player = new FourdPlayer();


// render
function animate() {
  requestAnimationFrame(animate);
  player.tick();
  renderer.render(scene, camera);
}
animate();
