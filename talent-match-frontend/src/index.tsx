import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import TalentMatchHomepage from './components/homePage';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <TalentMatchHomepage />
  </React.StrictMode>
);

reportWebVitals();
