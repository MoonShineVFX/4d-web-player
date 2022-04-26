import * as THREE from 'three';

import { OrbitControls } from './external/orbitControls';

import CONFIG from './config';


class RawTexture extends THREE.Texture {
  realGlTexture: WebGLTexture | null;
  isInitialize: boolean | null;

  constructor(gl: WebGLRenderingContext) {
    super();
    this.realGlTexture = gl.createTexture();
    this.isInitialize = false;
    this.encoding = THREE.sRGBEncoding;
    this.flipY = false;
  }
}


export default class Engine {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGL1Renderer;

  private orbitControls: OrbitControls;

  private readonly gl: WebGLRenderingContext;
  private rawTexture: RawTexture | null;
  uniMaterial: THREE.MeshBasicMaterial | null;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.engine.cameraFOV,
      window.innerWidth / window.innerHeight
    );
    this.renderer = new THREE.WebGL1Renderer({antialias: true});
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

    this.gl = this.renderer.domElement.getContext('webgl');
    this.rawTexture = null;
    this.uniMaterial = null;

    this.initialize();
  }

  private initialize() {
    // Base
    this.scene.background = new THREE.Color(CONFIG.engine.backgroundColor);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.prepend(this.renderer.domElement);
    this.camera.position.y = CONFIG.engine.cameraHeightOffset;
    this.camera.position.z = CONFIG.engine.cameraDistance;

    // Texture
    this.rawTexture = new RawTexture(this.gl);
    this.renderer.properties.get(this.rawTexture).__webglTexture = this.rawTexture.realGlTexture;
    this.uniMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, map: this.rawTexture});

    // Orbit controls
    this.orbitControls.enableDamping = true;
    this.orbitControls.target.y = CONFIG.engine.cameraHeightOffset;
  }

  updateRawTexture(imageData: TexImageSource | VideoFrame) {
    const gl = this.gl;

    if (!this.rawTexture.isInitialize) {
      // Initialize
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

  replaceSceneGroup(oldGroup: THREE.Group, newGroup: THREE.Group) {
    // Purge unused scene group
    if (oldGroup) {
      this.scene.remove(oldGroup);
      oldGroup.traverse(function(obj: any) {
        if(obj.dispose) obj.dispose();
      });
    }

    this.scene.add(newGroup);
  }

  render() {
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
