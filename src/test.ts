import { FourdRecPlayer, TextureType } from './player';
import { pad } from './utility';

const player = new FourdRecPlayer(TextureType.JPEG);

const urls = []
for (let i = 0; i < 1448; i++) {
  urls.push('/resource/jia/texture_1k/' + pad(i, 4, '0') + '.jpg');
}
player.loadTexture(urls);

const selectFile = document.getElementById('input-file') as HTMLInputElement;
selectFile.addEventListener('change', files => {
  player.loadMesh(selectFile.files);
})
