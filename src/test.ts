import {FourdRecPlayer, TextureType} from './player';
import {pad} from './utility';


// GLTF
const gltfUrls = []
for (let i = 0; i < 1038; i++) {
  gltfUrls.push('/resource/mi/gltf_mini_drc/' + pad(i, 4, '0') + '.glb');
}


const player = new FourdRecPlayer(TextureType.MP4);
player.loadTexture('/resource/mi/texture_1k.mp4');
player.loadMesh(gltfUrls);


// const selectFile = document.getElementById('input-file') as HTMLInputElement;
// selectFile.addEventListener('change', files => {
//   player.loadMesh(selectFile.files);
// })
