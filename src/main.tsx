import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { installControlSounds } from './sound';
import './styles/base.css';
import './styles/cards.css';
import './styles/pages.css';

installControlSounds();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
