import React from 'react';
import { useNavigate } from 'react-router-dom';
import './About.css';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="about-container">
      <header className="about-header">
        <nav className="about-nav">
          <button className="pixel-button" onClick={() => navigate('/')}>
            Back to Garden
          </button>
        </nav>
        <h1 className="pixel-title">About Pixel Garden</h1>
      </header>

      <main className="about-content">
        <div className="about-section">
          <h2 className="section-title">Welcome to Pixel Garden</h2>
          <p className="pixel-text">
            Pixel Garden is a blockchain-based farming game where players can grow,
            harvest, and trade virtual crops. Join our community of digital farmers
            and start your agricultural adventure!
          </p>
        </div>

        <div className="about-section features">
          <h2 className="section-title">Key Features</h2>
          <ul className="feature-list">
            <li className="feature-item">🌱 Plant and Grow Crops</li>
            <li className="feature-item">🚜 Manage Your Farm</li>
            <li className="feature-item">🐮 Raise Animals</li>
            <li className="feature-item">💰 Trade Your Harvest</li>
          </ul>
        </div>

        <div className="about-section team">
          <h2 className="section-title">Our Team</h2>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-avatar developer"></div>
              <h3>Lead Developer</h3>
              <p>Blockchain Expert</p>
            </div>
            <div className="team-member">
              <div className="member-avatar artist"></div>
              <h3>Pixel Artist</h3>
              <p>Creative Designer</p>
            </div>
            <div className="team-member">
              <div className="member-avatar community"></div>
              <h3>Community Manager</h3>
              <p>Player Support</p>
            </div>
          </div>
        </div>

        <div className="about-section contact">
          <h2 className="section-title">Join Our Community</h2>
          <div className="social-links">
            <a href="/discord" className="social-link discord">Discord</a>
            <a href="/twitter" className="social-link twitter">Twitter</a>
            <a href="/github" className="social-link github">GitHub</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About; 