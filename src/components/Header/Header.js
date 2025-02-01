import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import logo from '../../assets/header.png'; // Sesuaikan dengan path logo Anda

const Header = () => {
  return (
    <header className="game-header">
      <div className="header-content">
        <div className="title-wrapper">
          <img src={logo} alt="Farm Fun Logo" className="game-logo" />
         
        </div>
        <nav className="game-nav">
          <div className="nav-links">
            <Link to="/" className="pixel-button">HOME</Link>
            <span className="pixel-button disabled">PLAY</span>
            <a 
              href="https://youtube.com" 
              className="pixel-button" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              WHITEPAPER
            </a>
            <Link to="/demo" className="pixel-button">DEMO</Link>
          </div>
          <div className="nav-social">
            <a 
              href="https://twitter.com" 
              className="pixel-icon" 
              aria-label="Twitter"
              target="_blank" 
              rel="noopener noreferrer"
            >
              𝕏
            </a>
            <a 
              href="https://github.com" 
              className="pixel-icon" 
              aria-label="GitHub"
              target="_blank" 
              rel="noopener noreferrer"
            >
              ⌥
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header; 