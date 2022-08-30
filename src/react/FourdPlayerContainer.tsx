import React, {useEffect, useState} from 'react';
import FourdPlayer from '../FourdPlayer';
import {pad} from '../utility';


export default function FourdPlayerContainer(): JSX.Element {
  // Hooks
  const [fourdPlayer, setFourdPlayer] = useState<FourdPlayer>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (fourdPlayer !== null) return;

    // Make urls
    let meshUrls = []
    for (let i = 0; i < 1038; i++) {
      meshUrls.push(`/resource/mi/gltf_mini_drc/${pad(i, 4)}.glb`);
    }

    // Debug UI
    const handleLoadingState = (loadingState: boolean) => setIsLoading(loadingState);
    const handlePlaying = (frameNumber: number, totalFrame: number) => setPlayProgress(frameNumber / totalFrame);

    const player = new FourdPlayer(
      'fourd-web-viewport',
      '/resource/mi/texture_2k.mp4',
      meshUrls,
      handleLoadingState,
      handlePlaying
    );
    setFourdPlayer(player);
  }, [])

  // Dynamic style
  const dynamicStyle = {
    progressBar: {
      backgroundColor: isLoading ? 'darksalmon' : 'white',
      width: playProgress * 100 + '%'
    }
  }

  return <div>
    <div id="fourd-player-status">
      <div style={dynamicStyle.progressBar} className="loading"></div>
      {isLoading && <p>Loading</p>}
    </div>
    <canvas id="fourd-web-viewport"></canvas>
  </div>
}
