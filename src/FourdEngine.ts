import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'

import CONFIG from './Config';

THREE.ColorManagement.enabled = false

class RawTexture extends THREE.Texture {
  realGlTexture: WebGLTexture | null;
  isInitialize: boolean | null;

  constructor(gl: WebGLRenderingContext) {
    super();
    this.realGlTexture = gl.createTexture();
    this.isInitialize = false;
    this.colorSpace = THREE.SRGBColorSpace;
    this.flipY = false;
  }
}


export default class FourdEngine {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private orbitControls: OrbitControls;
  private modelPositionOffset: THREE.Vector3;

  private readonly gl: WebGLRenderingContext;
  private rawTexture: RawTexture | null;

  private currentMesh: THREE.Group | null;

  uniMaterial: THREE.MeshBasicMaterial | null;

  constructor(canvasDom: HTMLCanvasElement) {
    this.modelPositionOffset = new THREE.Vector3(...CONFIG.engine.modelPositionOffset);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.engine.cameraFOV,
      canvasDom.offsetWidth / canvasDom.offsetHeight,
      0.01
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvasDom,
      context: canvasDom.getContext('webgl2')
    });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace

    // XR
    const buttonElement = VRButton.createButton( this.renderer )
    buttonElement.setAttribute('style', 'position: absolute; top: 20px; padding: 12px 6px; border: 1px solid rgb(255, 255, 255); border-radius: 4px; background: rgba(0, 0, 0, 0.1); color: rgb(255, 255, 255); font: 13px sans-serif; text-align: center; opacity: 0.5; outline: none; z-index: 999; cursor: auto; left: calc(50% - 75px); width: 150px;')

    document.body.appendChild( buttonElement )
    this.renderer.xr.enabled = true

    this.renderer.setSize(canvasDom.offsetWidth, canvasDom.offsetHeight);
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

    this.gl = this.renderer.domElement.getContext('webgl2');
    this.rawTexture = null;
    this.uniMaterial = null;

    this.currentMesh = null;

    // Resize callback
    window.addEventListener('resize', () => {
      const resizeWidth = canvasDom.parentElement.clientWidth;
      const resizeHeight = canvasDom.parentElement.clientHeight;
      this.camera.aspect = resizeWidth / resizeHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(resizeWidth, resizeHeight);
    });

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

  private updateRawTexture(imageData: TexImageSource | VideoFrame) {
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

  updateMesh(mesh: THREE.Group, isHires: boolean = false) {
    // Check hires texture
    if (isHires) {
      const meshCore = mesh.children[0] as THREE.Mesh;
      const meshMaterial = meshCore.material as THREE.MeshStandardMaterial;
      meshMaterial.map.colorSpace = THREE.LinearSRGBColorSpace;
      this.uniMaterial.map = meshMaterial.map;
      meshCore.material = this.uniMaterial;
      meshMaterial.dispose();
    } else {
      if (this.uniMaterial.map !== this.rawTexture) this.uniMaterial.map = this.rawTexture;
    }

    // Add mesh and offset position
    mesh.position.add(this.modelPositionOffset);
    mesh.position.add(new THREE.Vector3(0, 1.7, -0.75))
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

  updateFrame(texture: HTMLVideoElement, mesh: THREE.Group) {
    this.updateRawTexture(texture);
    this.updateMesh(mesh);
  }

  render() {
    if (!this.renderer.xr.isPresenting) {
      this.orbitControls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  updateForXR() {
    this.renderer.setAnimationLoop(() => this.render())
  }
}
