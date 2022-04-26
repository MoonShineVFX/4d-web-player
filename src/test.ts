import {FourdRecPlayer, TextureType} from './player';

const player = new FourdRecPlayer(TextureType.MP4);

player.loadTexture('/resource/jia/texture_2k.mp4');

const selectFile = document.getElementById('input-file') as HTMLInputElement;
selectFile.addEventListener('change', files => {
  player.loadMesh(selectFile.files);
})
