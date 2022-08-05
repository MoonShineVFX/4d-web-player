import FourdPlayer from '../FourdPlayer';
import {pad} from '../utility';
import './dev.css';


// Make urls
let meshUrls = []
for (let i = 0; i < 1038; i++) {
  meshUrls.push(`/resource/mi/gltf_mini_drc/${pad(i, 4)}.glb`);
}

// Debug UI
const progressBar = document.getElementById('progress');
const loadingText = document.getElementById('loading')
const handleLoadingState = (loadingState: boolean) => {
  if (loadingState) {
    loadingText.style.display = 'block';
    progressBar.classList.add('loading');
    return
  }
  loadingText.style.display = 'none';
  progressBar.classList.remove('loading');
};
const handlePlaying = (frameNumber: number, totalFrame: number) => {
  progressBar.style.width = (frameNumber / totalFrame) * 100 + '%';
}

// Main
const player = new FourdPlayer(
  'fourd-web-viewport',
  '/resource/mi/texture_2k.mp4',
  meshUrls,
  handleLoadingState,
  handlePlaying
);
