const canvas = document.getElementById('canva');
const frameExtractor = new Mp4FrameExtractor(canvas);
frameExtractor.onReady = () => console.log('Extractor ready.');


fetch('texture_2k_debug_fr.mp4').then(
  response => response.arrayBuffer()
).then(
  arrayBuffer => {
    frameExtractor.loadArrayBuffer(arrayBuffer);
  }
);


document.addEventListener('keydown', event => {
  if (event.code === 'KeyD') {
    frameExtractor.nextFrame();
  }
})