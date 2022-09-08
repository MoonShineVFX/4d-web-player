import React, {useEffect, useRef, useState} from 'react';
import FourdPlayer, {FDPTextureState, FDPConfigMetadata} from '..';
import FDPlayerUIController from './components/FDPlayerUIController';
import './FDPlayerUI.less';
import getFirebaseUrl from './components/firebaseManager';

import {pad} from '../utility';


interface Message {
  className: string,
  text: string
}


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
  const [message, setMessage] = useState<Message>(null);

  // Get metadata
  useEffect(() => {
    const paths = window.location.pathname.split('/');
    const resourceName = paths[paths.length - 1];
    setResourceUrl(resourceName);

    const fetchMetadata = async () => {
      let metadataUrl: string;

      try {
        metadataUrl = await getFirebaseUrl(`${resourceName}/metadata.json`);
      } catch (error) {
        setMessage({className: 'error', text: `Resource not found: ${resourceName}`})
        return;
      }

      const response = await fetch(metadataUrl);
      if (response.status !== 200) {
        setMessage({className: 'error', text: `Resource not found: ${resourceName}`})
        return;
      }
      const data = await response.json();
      setMetadata(data);
    };
    fetchMetadata();
  }, [])
  // Initial FourdPlayer
  useEffect(() => {
    if (fourdPlayer !== null) return;
    if (!canvasRef || !metadata) return;

    const initialFourdPlayer = async () => {
      let meshUrls: string[] = []
      let promises: Promise<any>[] = []
      for (let i = 0; i < metadata.endFrame + 1; i++) {
        promises.push(
          getFirebaseUrl(`${resourceUrl}/mesh/${pad(i, 4)}.glb`).then(url => meshUrls[i] = url)
        )
      }

      console.log('Wait for url resolving...')
      await Promise.all(promises);

      const textureUrl = await getFirebaseUrl(`${resourceUrl}/texture.mp4`);

      const handlePlayerState = (playerState: FDPTextureState) => setPlayerState(playerState);

      const player = new FourdPlayer(
        canvasRef.current,
        textureUrl,
        meshUrls,
        handlePlayerState
      );
      setFourdPlayer(player);
    }
    initialFourdPlayer();
  }, [canvasRef, metadata])
  // Check isNotPlayedYet when autoplay is available
  useEffect(() => {
    if (isNotPlayedYet && playerState.isPlaying) {
      setIsNotPlayedYet(false);
    }
  }, [isNotPlayedYet, playerState.isPlaying])

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
      {!message && playerState.isLoading && <div className='loading-icon'></div>}
      {!playerState.isLoading && isNotPlayedYet && <p className='status-text'>讀取完成，點擊下方播放鍵播放</p>}
      {message && <p className={'status-text ' + message.className}>{message.text}</p>}
    </div>
    <FDPlayerUIController
      playerState={playerState}
      onTimeBarClick={handleTimeBarClick}
      onPlayButtonClick={handlePlayButtonClick}
    />
    <canvas ref={canvasRef}></canvas>
  </div>
}
