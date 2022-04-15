// make urls
let urls = {glb: [], jpg: []};
const url = '/resource/'
const frameCount = 1038;
for (let i = 0; i < frameCount; i++) {
  const padNumStr = String(i).padStart(4, '0');
  urls.glb[i] = url + 'gltf_mini_drc/' + padNumStr + '.glb';
  urls.jpg[i] = url + 'texture_1k/' + padNumStr + '.jpg';
}

// defines
const loadingGltfText = document.getElementById('loading-gltf');
const loadingTextureText = document.getElementById('loading-texture');

// 4d controller
const fourdController = new FourdController(TextureType.JPG);
fourdController.gltfExtractor.onLoading = progress => {
  loadingGltfText.innerHTML = progress * 100 + '%';
}
fourdController.textureExtractor.onLoading = progress => {
  loadingTextureText.innerHTML = progress * 100 + '%';
}
fourdController.loadGltf(undefined, urls.glb);
fourdController.loadTextureFromUrl(urls.jpg);

// input
function onFilesSelected(files) {
  fourdController.loadGltf(files);
}
