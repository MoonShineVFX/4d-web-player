import React from 'react';
import {createRoot} from 'react-dom/client';
import FDPlayerUI from './FDPlayerUI';
import './normalize.css';


const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<FDPlayerUI />);
