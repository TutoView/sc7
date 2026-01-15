
import React from 'react';
import ReactDOM from 'react-dom/client';
import { injectSpeedInsights } from '@vercel/speed-insights';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

injectSpeedInsights();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
