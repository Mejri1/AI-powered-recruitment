import React from 'react';
import './Homepage.css';

function Homepage() {
  return (
    <div className="Homepage">
      <header className="Homepage-header">
        <p>
          Edit <code>src/Homepage.js</code> and save to reload.
        </p>
        <a
          className="Homepage-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default Homepage;