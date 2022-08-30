import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom/client';

import FourdPlayer from '../FourdPlayer';
import {pad} from '../utility';
import './normalize.css';
import './index.css';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);


// Main
function ThePlayer(): JSX.Element {
  // Hooks
  const progressBar = useRef<HTMLDivElement>(null);
  const loadingText = useRef<HTMLParagraphElement>(null);
  const [fourdPlayer, setFourdPlayer] = useState<FourdPlayer>(null);

  useEffect(() => {
    if (fourdPlayer !== null) return;

    // Make urls
    let meshUrls = []
    for (let i = 0; i < 1038; i++) {
      meshUrls.push(`/resource/mi/gltf_mini_drc/${pad(i, 4)}.glb`);
    }

    // Debug UI
    const handleLoadingState = (loadingState: boolean) => {
      if (loadingState) {
        loadingText.current.style.display = 'block';
        progressBar.current.classList.add('loading');
        return
      }
      loadingText.current.style.display = 'none';
      progressBar.current.classList.remove('loading');
    };
    const handlePlaying = (frameNumber: number, totalFrame: number) => {
      progressBar.current.style.width = (frameNumber / totalFrame) * 100 + '%';
    }

    const player = new FourdPlayer(
      'fourd-web-viewport',
      '/resource/mi/texture_2k.mp4',
      meshUrls,
      handleLoadingState,
      handlePlaying
    );
    setFourdPlayer(player);
  }, [])

  return <div>
    <div id="status">
      <div ref={progressBar} className="loading"></div>
      <p ref={loadingText}>Loading</p>
    </div>
    <canvas id="fourd-web-viewport"></canvas>
  </div>
}

root.render(<ThePlayer />);
