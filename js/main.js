// make urls
const meta = {
  textureType: TextureType.JPG,
  name: '/resource/jia/',
  count: 1448,  // 1038
  mp4: 'texture_2k.mp4',
  urls: {glb: [], jpg: []}
}
for (let i = 0; i < meta.count; i++) {
  const padNumStr = String(i).padStart(4, '0');
  meta.urls.glb[i] = meta.name + 'gltf_mini_drc/' + padNumStr + '.glb';
  meta.urls.jpg[i] = meta.name + 'texture_1k/' + padNumStr + '.jpg';
}
const textureUrl = meta.textureType === TextureType.JPG ? meta.urls.jpg : meta.name + meta.mp4;

// defines
const loadingGltfText = document.getElementById('loading-gltf');
const loadingTextureText = document.getElementById('loading-texture');

// 4d controller
const fourdController = new FourdController(meta.textureType);
fourdController.gltfExtractor.onLoading = progress => {
  loadingGltfText.innerHTML = 'geo: ' + (progress * 100).toFixed(2) + '%';
}
fourdController.textureExtractor.onLoading = progress => {
  loadingTextureText.innerHTML = 'tex: ' + (progress * 100).toFixed(2) + '%';
}

fourdController.loadGltf(undefined, meta.urls.glb);
fourdController.loadTextureFromUrl(textureUrl);

// input
function onFilesSelected(files) {
  fourdController.loadGltf(files);
}
