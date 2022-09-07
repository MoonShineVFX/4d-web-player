import React, {useEffect, useRef, useState} from 'react';
import FourdPlayer, {FDPTextureState, FDPConfigMetadata} from '..';
import FDPlayerUIController from './components/FDPlayerUIController';
import './FDPlayerUI.less';

import {pad} from '../utility';


export default function FDPlayerUI(): JSX.Element {
  // Hooks
  const [fourdPlayer, setFourdPlayer] = useState<FourdPlayer>(null);
  const [playerState, setPlayerState] = useState<FDPTextureState>({
    isLoading: true,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 1.0,
    muted: false
  });
  const [resourceUrl, setResourceUrl] = useState<string>(null);
  const [metadata, setMetadata] = useState<FDPConfigMetadata>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isNotPlayedYet, setIsNotPlayedYet] = useState<boolean>(true);

  // Get metadata
  useEffect(() => {
    const storageHost = 'https://storage.googleapis.com/drec-player.appspot.com';
    const paths = window.location.pathname.split('/');
    const resourceName = paths[paths.length - 1];
    const thisResourceUrl = storageHost + '/' + resourceName;
    setResourceUrl(thisResourceUrl);

    const fetchMetadata = async () => {
      const response = await fetch(`${thisResourceUrl}/metadata.json`);
      const data = await response.json();
      setMetadata(data);
    };
    fetchMetadata();
  }, [])
  // Initial FourdPlayer
  useEffect(() => {
    if (fourdPlayer !== null) return;
    if (!canvasRef || !metadata) return;

    let meshUrls = []
    for (let i = 0; i < metadata.endFrame + 1; i++) {
      meshUrls.push(`${resourceUrl}/mesh/${pad(i, 4)}.glb`);
    }

    const handlePlayerState = (playerState: FDPTextureState) => setPlayerState(playerState);

    const player = new FourdPlayer(
      canvasRef.current,
      `${resourceUrl}/texture.mp4`,
      meshUrls,
      handlePlayerState
    );
    setFourdPlayer(player);
  }, [canvasRef, metadata])

  const handleTimeBarClick = (seekRatio: number) => {
    fourdPlayer.seekTexture(seekRatio * playerState.duration);
  }

  const handlePlayButtonClick = () => {
    if (playerState.isPlaying) {
      fourdPlayer.pauseTexture();
    } else {
      if (isNotPlayedYet) setIsNotPlayedYet(false);
      fourdPlayer.playTexture();
    }
  }

  return <div className='fourd-player-container'>
    <div className='overlay'>
      {playerState.isLoading && <div className='loading-icon'></div>}
      {!playerState.isLoading && isNotPlayedYet && <p className='status-text'>讀取完成，點擊下方播放鍵播放</p>}
    </div>
    <FDPlayerUIController
      playerState={playerState}
      onTimeBarClick={handleTimeBarClick}
      onPlayButtonClick={handlePlayButtonClick}
    />
    <canvas ref={canvasRef}></canvas>
  </div>
}
