import * as THREE from 'three';

import { OrbitControls } from './external/orbitControls';

import CONFIG from './Config';


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


export default class FourdEngine {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGL1Renderer;

  private orbitControls: OrbitControls;

  private readonly gl: WebGLRenderingContext;
  private rawTexture: RawTexture | null;

  private currentMesh: THREE.Group | null;

  uniMaterial: THREE.MeshBasicMaterial | null;

  constructor(elementID: string) {
    const canvasDom = document.getElementById(elementID)
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.engine.cameraFOV,
      canvasDom.offsetWidth / canvasDom.offsetHeight
    );
    this.renderer = new THREE.WebGL1Renderer({
      antialias: true,
      canvas: canvasDom
    });
    this.renderer.setSize(canvasDom.offsetWidth, canvasDom.offsetHeight);
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

    this.gl = this.renderer.domElement.getContext('webgl');
    this.rawTexture = null;
    this.uniMaterial = null;

    this.currentMesh = null;

    this.initialize();
  }

  private initialize() {
    // Base
    this.scene.background = new THREE.Color(CONFIG.engine.backgroundColor);
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

  updateMesh(mesh: THREE.Group) {
    this.scene.add(mesh);

    // Purge unused scene group
    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
      this.currentMesh.traverse(function(obj: any) {
        if(obj.dispose) obj.dispose();
        if (obj.isMesh) {
          obj.geometry.dispose();
        }
      });
    }

    this.currentMesh = mesh;
  }

  render() {
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
