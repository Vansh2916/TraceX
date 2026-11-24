import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { initFetchApiInterceptor } from './utils/api';

// Route all same-origin /api/* calls to deployed backend if VITE_API_URL is configured
initFetchApiInterceptor();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
