import { FourdRecPlayer } from './player';

const player = new FourdRecPlayer(null);

const selectFile = document.getElementById('input-file') as HTMLInputElement;
selectFile.addEventListener('change', files => {
  player.loadMesh(selectFile.files);
})
