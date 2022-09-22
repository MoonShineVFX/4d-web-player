import React, {useEffect, useRef, useState} from 'react';
import FourdPlayer, {FDPTextureState, FDPConfigMetadata, FDPMeshFrameState} from '..';
import FDPlayerUIController from './components/FDPlayerUIController';
import './FDPlayerUI.less';
import gerResourceUrl from './components/resourceManager';
import IconPlay from './icons/play_arrow.svg'
import CONFIG from "../Config";

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
  const [hiresMeshState, setHiresMeshState] = useState<FDPMeshFrameState>(FDPMeshFrameState.Empty);

  // Get metadata
  useEffect(() => {
    const paths = window.location.pathname.split('/');
    const resourceName = paths[paths.length - 1];

    if (resourceName === '') {
      setMessage({className: 'error', text: '請在網址輸入 4DREC 影片名稱'})
      return;
    }

    setResourceUrl(resourceName);

    const fetchMetadata = async () => {
      let metadataUrl: string;

      try {
        metadataUrl = await gerResourceUrl(`${resourceName}/metadata.json`);
      } catch (error) {
        console.error(error);
        setMessage({className: 'error', text: `未找到 4DREC 影片: ${resourceName}`})
        return;
      }

      const response = await fetch(metadataUrl);
      if (response.status !== 200) {
        setMessage({className: 'error', text: `未找到 4DREC 影片: ${resourceName}`})
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
      let meshUrls: string[] = [];
      let hiresUrls: string[] = [];
      let promises: Promise<any>[] = [];
      for (let i = 0; i < metadata.endFrame + 1; i++) {
        promises.push(
          gerResourceUrl(`${resourceUrl}/mesh/${pad(i, 4)}.glb`).then(url => meshUrls[i] = url)
        )
        if (metadata.hires) {
          promises.push(
            gerResourceUrl(`${resourceUrl}/hires/${pad(i, 4)}.glb`).then(url => hiresUrls[i] = url)
          )
        }
      }

      console.log('Wait for url resolving...')
      await Promise.all(promises);

      const textureUrl = await gerResourceUrl(`${resourceUrl}/texture.mp4`);

      const handlePlayerState = (playerState: FDPTextureState) => setPlayerState(playerState);
      const handleHiresState = (hiresMeshState: FDPMeshFrameState) => setHiresMeshState(hiresMeshState);

      const player = new FourdPlayer(
        canvasRef.current,
        textureUrl,
        meshUrls,
        handlePlayerState,
        metadata,
        metadata.hires ? hiresUrls : undefined,
        handleHiresState
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
    {CONFIG.isWebview && <p className='notification'>偵測到目前使用內嵌瀏覽器，請用外部瀏覽器開啟連結以確保正確使用體驗。</p>}
    <div className='overlay'>
      {!message && playerState.isLoading && <div className='overlay-loading'>
        <div className='loading-icon'></div>
        {isNotPlayedYet && <p className='status-text'>{resourceUrl} 讀取中</p>}
      </div>}
      {!playerState.isLoading && isNotPlayedYet && <p className='status-text'>讀取完成，點擊下方播放鍵 <IconPlay/> 播放</p>}
      {message && <p className={'status-text ' + message.className}>{message.text}</p>}
    </div>
    {fourdPlayer && <FDPlayerUIController
      playerState={playerState}
      onTimeBarClick={handleTimeBarClick}
      onPlayButtonClick={handlePlayButtonClick}
      hiresMeshState={hiresMeshState}
    />}
    <canvas ref={canvasRef}></canvas>
  </div>
}
