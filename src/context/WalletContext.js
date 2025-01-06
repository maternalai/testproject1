import React, { createContext, useState, useContext, useEffect } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
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
      if (solana?.isPhantom) {
        const response = await solana.connect();
        const address = response.publicKey.toString();
        console.log('Connected wallet address:', address);
        setWalletAddress(address);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
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
      walletAddress,
      isWalletConnected: !!walletAddress,
      connectWallet,
      disconnectWallet,
      showWalletNotification
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 