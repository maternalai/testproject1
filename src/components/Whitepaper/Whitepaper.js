import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './Whitepaper.css';

const Whitepaper = () => {
  return (
    <div className="whitepaper-container">
      <Header />
      <div className="whitepaper-content">
        <h1 className="whitepaper-title">Pixel Garden Whitepaper</h1>
        
        <section className="whitepaper-section">
          <h2>Introduction</h2>
          <p>
            Pixel Garden is a blockchain-based farming simulation game that combines
            traditional gaming mechanics with NFT technology and DeFi elements.
          </p>
        </section>

        <section className="whitepaper-section">
          <h2>Game Mechanics</h2>
          <div className="mechanics-grid">
            <div className="mechanic-item">
              <h3>Farming</h3>
              <p>
                Players can plant, water, and harvest various crops. Each plant is
                a unique NFT with its own traits and characteristics.
              </p>
            </div>
            <div className="mechanic-item">
              <h3>NFT System</h3>
              <p>
                All in-game assets including plants, tools, and land plots are
                represented as NFTs on the blockchain.
              </p>
            </div>
          </div>
        </section>

        <section className="whitepaper-section">
          <h2>Tokenomics</h2>
          <div className="tokenomics-details">
            <div className="token-info">
              <h3>$SEED Token</h3>
              <p>
                The native utility token of Pixel Garden, used for transactions,
                governance, and rewards.
              </p>
            </div>
            <div className="token-distribution">
              <h3>Distribution</h3>
              <ul>
                <li>Play to Earn: 30%</li>
                <li>Liquidity Pool: 25%</li>
                <li>Development: 20%</li>
                <li>Team & Advisors: 10%</li>
                <li>Marketing: 10%</li>
                <li>Reserve: 5%</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="whitepaper-section">
          <h2>Technical Architecture</h2>
          <p>
            Built on [Blockchain Name] for low transaction fees and high
            scalability. Smart contracts are written in Solidity and audited by
            [Audit Firm].
          </p>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Whitepaper; 