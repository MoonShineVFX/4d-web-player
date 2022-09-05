import React from 'react';
import {createRoot} from 'react-dom/client';
import FourdPlayerContainer from './FourdPlayerContainer';
import './normalize.css';


const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<FourdPlayerContainer />);
