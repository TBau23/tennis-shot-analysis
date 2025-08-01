import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          🎾 Tennis Shot Classifier
        </h1>
        <p className="header-subtitle">
          Upload your tennis videos and get instant shot analysis with MoveNet
        </p>
      </div>
    </header>
  );
}

export default Header; 