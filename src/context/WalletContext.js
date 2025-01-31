import React, { createContext, useState, useContext, useEffect } from 'react';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, getMint } from '@solana/spl-token';

const WalletContext = createContext();

// Update RPC endpoint
const RPC_ENDPOINT = "https://mainnet.helius-rpc.com/?api-key=1db05468-e227-45cf-bd9f-cea0534b1f18";

const getConnection = () => {
  return new Connection(RPC_ENDPOINT, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000
  });
};

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [notification, setNotification] = useState(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);

  // Token constants
  const TOKEN_MINT = new PublicKey('9m9dqnnQzFTd5tycT2XdnfPW5NKVVkoSmx4o1iu6pump');
  const DECIMALS = 6;

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

  const checkTokenBalance = async (publicKey) => {
    try {
      const connection = getConnection();
      
      // Get associated token account
      const associatedTokenAddress = await getAssociatedTokenAddress(
        TOKEN_MINT,
        publicKey
      );

      console.log('Checking token account:', associatedTokenAddress.toString());

      try {
        // Get token account info
        const tokenAccount = await getAccount(connection, associatedTokenAddress);
        const mintInfo = await getMint(connection, TOKEN_MINT);
        
        // Calculate actual balance
        const balance = Number(tokenAccount.amount) / Math.pow(10, mintInfo.decimals);
        console.log('Token balance:', balance);
        setTokenBalance(balance);
        return balance;
      } catch (e) {
        console.log('No token account found:', e);
        setTokenBalance(0);
        return 0;
      }
    } catch (error) {
      console.error('Error checking token balance:', error);
      setTokenBalance(0);
      return 0;
    }
  };

  const checkWalletConnection = async () => {
    try {
      const { solana } = window;
      
      if (!solana?.isPhantom) {
        return false;
      }

      const connected = solana.isConnected;
      if (connected) {
        const publicKey = solana.publicKey;
        const address = publicKey.toString();
        setWalletAddress(shortenAddress(address));
        
        // Check token balance when wallet is connected
        await checkTokenBalance(publicKey);
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
        showWalletNotification('Please install Phantom Wallet!', true);
        return;
      }

      console.log('Requesting wallet connection...');
      const response = await solana.connect();
      const address = response.publicKey.toString();
      console.log('Connected wallet address:', address);
      
      setWalletAddress(address);
      setIsWalletConnected(true);
      
      // Check token balance after connection
      await checkTokenBalance(response.publicKey);
      
      showWalletNotification('Wallet connected successfully!');
    } catch (error) {
      console.error('Wallet connection error:', error);
      showWalletNotification('Failed to connect wallet', true);
    }
  };

  const disconnectWallet = async () => {
    try {
      const { solana } = window;
      if (solana) {
        await solana.disconnect();
        setIsWalletConnected(false);
        setWalletAddress('');
        setTokenBalance(0);
        
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

    // Add listener for wallet connection changes
    const { solana } = window;
    if (solana) {
      solana.on('connect', async () => {
        console.log('Wallet connected event');
        await checkWalletConnection();
      });

      solana.on('disconnect', () => {
        console.log('Wallet disconnected event');
        setIsWalletConnected(false);
        setWalletAddress('');
        setTokenBalance(0);
      });

      solana.on('accountChanged', async () => {
        console.log('Wallet account changed event');
        await checkWalletConnection();
      });
    }

    return () => {
      if (solana) {
        solana.removeAllListeners('connect');
        solana.removeAllListeners('disconnect');
        solana.removeAllListeners('accountChanged');
      }
    };
  }, []);

  return (
    <WalletContext.Provider value={{
      walletAddress,
      isWalletConnected: !!walletAddress,
      connectWallet,
      disconnectWallet,
      showWalletNotification,
      tokenBalance,
      checkTokenBalance,
      TOKEN_MINT,
      DECIMALS
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