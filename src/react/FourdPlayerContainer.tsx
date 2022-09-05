import React, {useEffect, useRef, useState} from 'react';
import FourdPlayer from '../FourdPlayer';
import {FourdPlayerState} from '../FourdPlayer';
import './FourdPlayerContainer.less';

import {pad} from '../utility';


export default function FourdPlayerContainer(): JSX.Element {
  // Hooks
  const [fourdPlayer, setFourdPlayer] = useState<FourdPlayer>(null);
  const [playerState, setPlayerState] = useState<FourdPlayerState>({
    isLoading: true,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 1.0,
    muted: false
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (fourdPlayer !== null) return;
    if (!canvasRef) return;

    // Make urls
    let meshUrls = []
    for (let i = 0; i < 1038; i++) {
      meshUrls.push(`/resource/mi/gltf_mini_drc/${pad(i, 4)}.glb`);
    }

    const handlePlayerState = (playerState: FourdPlayerState) => setPlayerState(playerState);

    const player = new FourdPlayer(
      canvasRef.current,
      '/resource/mi/texture_2k.mp4',
      meshUrls,
      handlePlayerState
    );
    setFourdPlayer(player);
  }, [canvasRef])

  // Dynamic style
  const dynamicStyle = {
    progressBar: {
      backgroundColor: playerState.isLoading ? 'darksalmon' : 'white',
      width: (playerState.currentTime / playerState.duration) * 100 + '%'
    }
  }

  return <div className='fourd-player-container'>
    <div className="player-status">
      <div style={dynamicStyle.progressBar} className="loading"></div>
      {playerState.isLoading && <p>Loading</p>}
    </div>
    <canvas ref={canvasRef}></canvas>
  </div>
}
