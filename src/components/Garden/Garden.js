import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './Garden.css';

// Import pixel art icons
import farmingIcon from '../../assets/Premium/Animals/Cow/Free Cow Sprites.png';

import marketplaceIcon from '../../assets/Premium/Ground_Hill_Tiles_Slopes.png';
import breedingIcon from '../../assets/Premium/Objects/Basic_plants.png';
import seasonsIcon from '../../assets/Premium/Objects/Piknik basket.png';
import communityIcon from '../../assets/Premium/Objects/Items/egg-items.png';
import rewardsIcon from '../../assets/Premium/Characters/Tools.png';

const FEATURES = [
  {
    id: 1,
    title: "Farming System",
    description: "Plant, water, and harvest your crops in our unique pixel art environment. Each plant is an NFT with special traits.",
    icon: farmingIcon,
    altText: "Pixel art of farming tools and plants"
  },
  {
    id: 2,
    title: "NFT Marketplace",
    description: "Trade your harvested crops and rare plants with other players. Each transaction is secured by blockchain.",
    icon: marketplaceIcon,
    altText: "Pixel art of marketplace shop"
  },
  {
    id: 3,
    title: "Plant Breeding",
    description: "Combine different plants to create new, unique varieties with rare traits and enhanced properties.",
    icon: breedingIcon,
    altText: "Pixel art of plant breeding"
  },
  {
    id: 4,
    title: "Seasonal Events",
    description: "Experience different seasons with unique plants, special events, and limited-time rewards.",
    icon: seasonsIcon,
    altText: "Pixel art of seasonal icons"
  },
  {
    id: 5,
    title: "Community Gardens",
    description: "Join forces with other players to create and maintain community gardens with shared rewards.",
    icon: communityIcon,
    altText: "Pixel art of community garden"
  },
  {
    id: 6,
    title: "Daily Rewards",
    description: "Earn tokens and special items through daily tasks and achievements in your garden.",
    icon: rewardsIcon,
    altText: "Pixel art of treasure chest"
  }
];

const ROADMAP_ITEMS = [
  {
    id: 1,
    phase: "Q1 2024",
    title: "Foundation Launch",
    description: [
      "Smart Contract Development",
      "Basic Farming Mechanics",
      "Initial Game Design",
      "Website Launch"
    ],
    status: "completed"
  },
  {
    id: 2,
    phase: "Q2 2024",
    title: "NFT Integration",
    description: [
      "NFT Marketplace Launch",
      "Plant Collection Release",
      "Trading System",
      "Wallet Integration"
    ],
    status: "in-progress"
  },
  {
    id: 3,
    phase: "Q3 2024",
    title: "Community Features",
    description: [
      "Multiplayer Gardens",
      "Social Features",
      "Community Events",
      "Chat System"
    ],
    status: "upcoming"
  },
  {
    id: 4,
    phase: "Q4 2024",
    title: "Advanced Gameplay",
    description: [
      "Plant Breeding System",
      "Seasonal Events",
      "Advanced Farming",
      "Achievement System"
    ],
    status: "upcoming"
  },
  {
    id: 5,
    phase: "Q1 2025",
    title: "Governance System",
    description: [
      "DAO Implementation",
      "Community Voting",
      "Token Staking",
      "Reward System"
    ],
    status: "upcoming"
  },
  {
    id: 6,
    phase: "Q2 2025",
    title: "Ecosystem Expansion",
    description: [
      "Cross-chain Integration",
      "Strategic Partnerships",
      "Game Universe Expansion",
      "Mobile Version"
    ],
    status: "upcoming"
  }
];

const TOKENOMICS_DATA = [
  {
    id: 1,
    title: "Play to Earn",
    percentage: "30%",
    description: "Rewards for active players and community events",
    icon: "🎮"
  },
  {
    id: 2,
    title: "Liquidity Pool",
    percentage: "25%",
    description: "Ensuring stable trading and market depth",
    icon: "💧"
  },
  {
    id: 3,
    title: "Development",
    percentage: "20%",
    description: "Continuous game development and updates",
    icon: "⚙️"
  },
  {
    id: 4,
    title: "Team & Advisors",
    percentage: "10%",
    description: "Core team and strategic advisors",
    icon: "👥"
  },
  {
    id: 5,
    title: "Marketing",
    percentage: "10%",
    description: "Growth and community building initiatives",
    icon: "📢"
  },
  {
    id: 6,
    title: "Reserve",
    percentage: "5%",
    description: "Emergency fund and future opportunities",
    icon: "🏦"
  }
];

const Garden = () => {
  return (
    <div className="game-container">
      <Header />
      <div className="content-wrapper">
        {/* Welcome Section */}
        <main className="content-container welcome-section">
          <h1 className="section-title">Welcome to Solana Garden</h1>
          <p className="section-text">
            Start your journey in the world of blockchain gardening. Plant, grow, and trade unique pixel plants as NFTs.
          </p>
          <div className="cta-buttons">
            <button className="pixel-button primary">Connect Wallet</button>
            <button className="pixel-button secondary">Learn More</button>
          </div>
        </main>

        {/* Game Features Section */}
        <section className="content-container features-section">
          <h2 className="section-title">Game Features</h2>
          <div className="feature-grid-detailed">
            {FEATURES.map((feature) => (
              <div key={feature.id} className="feature-item">
                <div className="feature-icon-wrapper">
                  <img 
                    src={feature.icon} 
                    alt={feature.altText}
                    className="feature-icon"
                  />
                </div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="content-container roadmap-section">
          <h2 className="section-title">Development Roadmap</h2>
          <div className="roadmap-grid">
            {ROADMAP_ITEMS.map((item) => (
              <div key={item.id} className={`roadmap-item ${item.status}`}>
                <div className="roadmap-header">
                  <span className="phase-tag">{item.phase}</span>
                  <span className={`status-indicator ${item.status}`}></span>
                </div>
                <h4>{item.title}</h4>
                <ul className="roadmap-list">
                  {item.description.map((point, index) => (
                    <li key={index} className="roadmap-point">
                      <span className="bullet">►</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Tokenomics Section */}
        <section className="content-container tokenomics-section">
          <h2 className="section-title">Tokenomics</h2>
          <div className="tokenomics-grid">
            {TOKENOMICS_DATA.map((item) => (
              <div key={item.id} className="tokenomics-item">
                <div className="tokenomics-icon">{item.icon}</div>
                <div className="tokenomics-content">
                  <h4>{item.title}</h4>
                  <div className="percentage-bar">
                    <div 
                      className="percentage-fill"
                      style={{ width: item.percentage }}
                    ></div>
                    <span className="percentage-text">{item.percentage}</span>
                  </div>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Garden; 