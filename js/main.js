// make urls
let urls = [];
const url = '/resource/gltf_mini_drc/'
const frameCount = 1038;
for (let i = 0; i < frameCount; i++) {
  urls[i] = url + String(i).padStart(4, '0') + '.glb';
}

// defines
const loadingGltfText = document.getElementById('loading-gltf');
const loadingTextureText = document.getElementById('loading-texture');

// 4d controller
const fourdController = new FourdController();
fourdController.gltfExtractor.onLoading = progress => {
  loadingGltfText.innerHTML = progress * 100 + '%';
}
fourdController.mp4Extractor.onReady = () => {
  loadingTextureText.innerHTML = 'Loaded';
}
fourdController.loadGltf(undefined, urls);
fourdController.loadTextureFromMp4('texture_2k.mp4');

// input
function onFilesSelected(files) {
  fourdController.loadGltf(files);
}
