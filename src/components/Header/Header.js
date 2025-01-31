import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="game-header">
      <div className="header-content">
        <div className="title-wrapper">
            <h1 className="pixel-title">SOLANA GARDEN</h1>
        </div>
        <nav className="game-nav">
          <div className="nav-links">
            <Link to="/" className="pixel-button">HOME</Link>
            {/* <span className="pixel-button disabled">PLAY</span> */}
            <Link to="/join" className="pixel-button">PLAY</Link>
            <Link to="/whitepaper" className="pixel-button">WHITEPAPER</Link>
            <Link to="/about" className="pixel-button">ABOUT</Link>
            <Link to="/demo" className="pixel-button">DEMO</Link>
          </div>
          <div className="nav-social">
            <a href="/twitter" className="pixel-icon" aria-label="Twitter">𝕏</a>
            <a href="/github" className="pixel-icon" aria-label="GitHub">⌥</a>
            <a href="/discord" className="pixel-icon" aria-label="Discord">◈</a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header; 