import React from 'react';
import {FourdPlayerState} from '../FourdPlayer';


export default function FourdPlayerController(props: {playerState: FourdPlayerState}): JSX.Element {
  const {playerState} = props;
  const timeBarProgressWidth = (playerState.currentTime / playerState.duration) * 100 + '%';

  return <div className='controller'>
    <div className='time-control'>
      <TimeStampText time={playerState.currentTime} />
      <div className='time-bar'>
        <div style={{width: timeBarProgressWidth}} className='time-bar-core'></div>
      </div>
      <TimeStampText time={playerState.duration} />
    </div>
    <div className='buttons'>
      <h3>button</h3>
    </div>
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
