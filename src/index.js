import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/Pages.css';  // ✅ make sure this is correct
import './index.css';         // ← optional, if you're using it

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);