const CAMERA_FOV = 60;
const CAMERA_DISTANCE = 0.8;
const CAMERA_HEIGHT_OFFSET = -0.15;
const BACKGROUND_COLOR = 0x152126;


class ThreeEngine {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight);
    this.renderer = new THREE.WebGL1Renderer({antialias: true});
    this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    this.gl = this.renderer.domElement.getContext('webgl');
    this.rawTexture = undefined;
    this.uniMaterial = undefined;

    this.initialize();
  }

  initialize() {
    // base
    this.scene.background = new THREE.Color(BACKGROUND_COLOR);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.prepend(this.renderer.domElement);
    this.camera.position.y = CAMERA_HEIGHT_OFFSET;
    this.camera.position.z = CAMERA_DISTANCE;

    // texture
    this.rawTexture = new THREE.Texture();
    this.rawTexture.realGlTexture = this.gl.createTexture();
    this.rawTexture.isInitialize = false;  // for update
    this.rawTexture.encoding = THREE.sRGBEncoding;
    this.rawTexture.flipY = false;
    this.renderer.properties.get(this.rawTexture).__webglTexture = this.rawTexture.realGlTexture;
    this.uniMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, map: this.rawTexture});

    // orbit controls
    this.orbitControls.enableDamping = true;
    this.orbitControls.target.y = CAMERA_HEIGHT_OFFSET;
  }
  
  updateRawTexture(imageData) {
    const gl = this.gl;

    if (!this.rawTexture.isInitialize) {
      // initialize
      this.rawTexture.isInitialize = true;

      gl.bindTexture(gl.TEXTURE_2D, this.rawTexture.realGlTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    } else {
      gl.bindTexture(gl.TEXTURE_2D, this.rawTexture.realGlTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
    }
  }

  updateTexture(texture) {
    this.uniMaterial.map = texture;
  }

  replaceGltf(oldGltf, newGltf) {
    if (oldGltf) {
      this.scene.remove(oldGltf);
      oldGltf.traverse(function(obj) {
        if(obj.geometry)
          obj.geometry.dispose();
        if(obj.mesh)
          obj.mesh.dispose();
        if(obj.material)
          obj.material.dispose();
        if(obj.texture)
          obj.texture.dispose();
      });
    }

    this.scene.add(newGltf);
  }

  render() {
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  }
}