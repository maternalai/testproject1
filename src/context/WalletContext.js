import React, { createContext, useState, useContext, useEffect } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [notification, setNotification] = useState(null);
  const [notificationVisible, setNotificationVisible] = useState(false);

  const shortenAddress = (address) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const showWalletNotification = (message, isError = false) => {
    if (notificationVisible) return;
    
    setNotificationVisible(true);
    setNotification({ message, isError });
    
    setTimeout(() => {
      setNotification(null);
      setNotificationVisible(false);
    }, 3000);
  };

  const checkWalletConnection = async () => {
    try {
      const { solana } = window;
      
      if (!solana?.isPhantom) {
        return false;
      }

      const connected = solana.isConnected;
      if (connected) {
        const publicKey = solana.publicKey.toString();
        setWalletAddress(shortenAddress(publicKey));
      }
      setIsWalletConnected(connected);
      return connected;
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      return false;
    }
  };

  const connectWallet = async () => {
    try {
      const { solana } = window;
      
      if (!solana?.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        return;
      }

      const response = await solana.connect();
      setWalletAddress(shortenAddress(response.publicKey.toString()));
      setIsWalletConnected(true);
      
      if (!notificationVisible) {
        showWalletNotification('Successfully connected to wallet!');
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      if (!notificationVisible) {
        showWalletNotification('Failed to connect wallet', true);
      }
    }
  };

  const disconnectWallet = async () => {
    try {
      const { solana } = window;
      if (solana) {
        await solana.disconnect();
        setIsWalletConnected(false);
        setWalletAddress('');
        
        if (!notificationVisible) {
          showWalletNotification('Wallet disconnected');
        }
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      if (!notificationVisible) {
        showWalletNotification('Failed to disconnect wallet', true);
      }
    }
  };

  useEffect(() => {
    checkWalletConnection();
  }, []);

  return (
    <WalletContext.Provider value={{
      isWalletConnected,
      walletAddress,
      notification,
      notificationVisible,
      connectWallet,
      disconnectWallet,
      showWalletNotification
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext); 