import React, {useEffect, useRef} from 'react';
import {FDPTextureState, FDPMeshFrameState} from '../..';
import IconPause from '../icons/pause.svg';
import IconPlay from '../icons/play_arrow.svg';
import IconDone from '../icons/done.svg';


export default function FDPlayerUIController(props: {
  playerState: FDPTextureState,
  hiresMeshState: FDPMeshFrameState,
  onTimeBarClick: (seekRatio: number) => void,
  onPlayButtonClick: () => void
}): JSX.Element {
  const {playerState} = props;

  // hooks
  const timeBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const keyPressedHandler = (event: KeyboardEvent) => {
      switch (event.key) {
        case ' ':
          props.onPlayButtonClick();
          return;
        default:
          return;
      }
    }

    window.addEventListener('keydown', keyPressedHandler);
    return () => window.removeEventListener('keydown', keyPressedHandler);
  }, [props.onPlayButtonClick])

  const timeBarProgressWidth = (playerState.currentTime / playerState.duration) * 100 + '%';

  const handleTimeBarClick = (event: React.MouseEvent) => {
    const seekRatio = event.nativeEvent.offsetX / timeBarRef.current!.offsetWidth;
    props.onTimeBarClick(seekRatio);
  }

  return <div className='controller' style={{opacity: playerState.duration === 0 ? '0' : '1'}}>
    <div className='time-control'>
      <TimeStampText time={playerState.currentTime} />
      <div ref={timeBarRef} className='time-bar' onClick={handleTimeBarClick}>
        <div style={{width: timeBarProgressWidth}} className='time-bar-core'></div>
      </div>
      <TimeStampText time={playerState.duration} />
    </div>
    <div className='buttons'>
      <ControllerButton
        icon={playerState.isPlaying ? IconPause : IconPlay}
        onClick={props.onPlayButtonClick}
        disabled={playerState.isLoading}
      />
      <div className='info-right'>
        <HiresInfo hiresMeshState={props.hiresMeshState}/>
      </div>
    </div>
  </div>
}

// Button
function ControllerButton(props: {
  disabled?: boolean,
  icon: React.FC<React.SVGProps<SVGSVGElement>>,
  className?: string,
  onClick?: () => void
}): JSX.Element {
  const Icon = props.icon;
  let className = 'controller-button';
  if (props.className) className += ' ' + props.className;
  if (props.disabled) className += ' disabled';
  return <Icon className={className} onClick={props.onClick}/>
}

function HiresInfo(props: {hiresMeshState: FDPMeshFrameState}): JSX.Element {
  const {hiresMeshState} = props;
  const isShow = hiresMeshState === FDPMeshFrameState.Empty ? {display: 'none'} : {};
  return <div className='info-hires' style={isShow}>
    {hiresMeshState === FDPMeshFrameState.Loading && <div className='loading-icon'></div>}
    {hiresMeshState === FDPMeshFrameState.Loaded && <IconDone/>}
    <span>高解析模型</span>
  </div>
}


// TimeStampText
function TimeStampText(props: {time: number}): JSX.Element {
  const hours = Math.floor(props.time / 3600);
  const minutes = Math.floor((props.time - (hours * 3600)) / 60);
  const seconds = Math.round(props.time - (hours * 3600) - (minutes * 60));

  const hoursStr = hours < 10 ? '0' + hours : hours.toString();
  const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
  const secondsStr = seconds < 10 ? '0' + seconds : seconds.toString();

  let resultStr = '';
  if (hours > 0) {
    resultStr += hoursStr + ':';
  }
  resultStr += `${minutesStr}:${secondsStr}`

  return <p className='timestamp'>{resultStr}</p>
}
