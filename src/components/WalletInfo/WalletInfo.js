import React from 'react';
import './WalletInfo.css';

const WalletInfo = ({ walletAddress, onDisconnect }) => {
  if (!walletAddress) return null;

  return (
    <div className="wallet-info">
      <div className="wallet-address">
        <span className="wallet-icon">👛</span>
        <span className="address">{walletAddress}</span>
      </div>
      <button onClick={onDisconnect} className="disconnect-btn">
        Disconnect
      </button>
    </div>
  );
};

export default WalletInfo; 