import React, { useState, useEffect, useCallback } from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import WalletInfo from '../WalletInfo/WalletInfo';
import './Join.css';
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { seeds as seedsData } from '../constants/seeds.js';
import { getStoreWallet, getNetwork } from '../../utils/storeWallet';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { clearUserData, loadUserData, saveUserData } from '../../services/userDataService';
import { 
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import BN from 'bn.js';

// Add Buffer to window object
window.Buffer = Buffer;

// Move WalletNotification outside the Join component
const WalletNotification = ({ notification }) => {
  if (!notification) return null;
  
  return (
    <div className={`wallet-notification ${notification.isError ? 'error' : 'success'}`}>
      {notification.message}
    </div>
  );
};

const HarvestConfirmPopup = ({ onConfirm, onCancel, plantName, plantIcon }) => {
  return (
    <div className="harvest-confirm-popup">
      <div className="harvest-confirm-content">
        <h3 className="harvest-confirm-title">Confirm Harvest</h3>
        <p className="harvest-confirm-message">
          Are you sure you want to harvest your {plantName}{plantIcon}?
          <br />
          You will receive rewards after harvesting.
        </p>
        <div className="harvest-confirm-buttons">
          <button 
            className="harvest-confirm-btn harvest-confirm-no"
            onClick={onCancel}
          >
            No
          </button>
          <button 
            className="harvest-confirm-btn harvest-confirm-yes"
            onClick={onConfirm}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

const HarvestSuccessPopup = ({ onClose, plantName, reward, plantIcon }) => {
  // Menambahkan state untuk animasi closing
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Timer untuk memulai animasi closing
    const closeTimer = setTimeout(() => {
      setIsClosing(true);
    }, 2700); // Mulai animasi closing 300ms sebelum popup benar-benar hilang

    // Timer untuk menutup popup
    const hideTimer = setTimeout(() => {
      onClose();
    }, 3000);

    // Cleanup semua timer
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(hideTimer);
    };
  }, [onClose]);

  // Handle close button click
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Tunggu animasi selesai
  };

  return (
    <div className={`harvest-success-popup ${isClosing ? 'closing' : ''}`}>
      <div className="harvest-success-content">
        <h3 className="harvest-success-title">Harvest Successful!</h3>
        <p className="harvest-success-message">
          You have successfully harvested your {plantName}{plantIcon}!
        </p>
        <div className="reward-amount">
          + {reward} SOL
        </div>
        <p className="harvest-success-message">
          The rewards have been added to your wallet.
        </p>
        <div className="timer-bar"></div>
        <button 
          className="harvest-success-btn"
          onClick={handleClose}
        >
          Congrats!
        </button>
      </div>
    </div>
  );
};

const Join = () => {
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState('store');
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [plots, setPlots] = useState(Array(20).fill().map((_, index) => ({ 
    id: index,
    planted: false,
    plantType: null,
    growthStage: 0,
    isWatered: false,
    plantedAt: null,
    readyToHarvest: false
  })));
  const [hoveredPlot, setHoveredPlot] = useState(null);
  const [harvestNotification, setHarvestNotification] = useState(null);
  const [showWalletPrompt, setShowWalletPrompt] = useState(true);
  const [userSeeds, setUserSeeds] = useState({}); // Track owned seeds
  const [userBalance, setUserBalance] = useState(0); // Track SOL balance
  const TOKEN_MINT = new PublicKey('9m9dqnnQzFTd5tycT2XdnfPW5NKVVkoSmx4o1iu6pump');
  const STORE_WALLET = new PublicKey('BjRqc12wBARLf1ja7Rxax3asFcx1ND7yPcyiSwABWawP');
  const TOKEN_DECIMALS = 6;
  const [harvestingPlots, setHarvestingPlots] = useState({}); // Track harvesting state per plot
  const [showHarvestConfirm, setShowHarvestConfirm] = useState(false);
  const [selectedPlotForHarvest, setSelectedPlotForHarvest] = useState(null);
  const [showHarvestSuccess, setShowHarvestSuccess] = useState(false);
  const [harvestSuccessInfo, setHarvestSuccessInfo] = useState(null);

  const { 
    isWalletConnected, 
    walletAddress, 
    disconnectWallet, 
    connectWallet,
    notification 
  } = useWallet();

  const tools = [
    { id: 'store', name: 'ITEM SHOP', icon: '🌱' },
    { id: 'garden', name: 'GARDEN AREA', icon: '🏠' },
    { id: 'farm', name: 'FARM', icon: '🚜' },
    { id: 'nft', name: ' MARKET', icon: 'X' }
  ];

  // Menggunakan Helius RPC endpoint
  const MAINNET_RPC_URL = "https://mainnet.helius-rpc.com/?api-key=1db05468-e227-45cf-bd9f-cea0534b1f18";
  
  const getConnection = () => {
    return new Connection(MAINNET_RPC_URL, {
      commitment: 'confirmed',
      wsEndpoint: undefined,
      confirmTransactionInitialTimeout: 60000 // 60 seconds timeout
    });
  };

  useEffect(() => {
    const growthInterval = setInterval(() => {
      setPlots(prevPlots => 
        prevPlots.map(plot => {
          if (plot.planted && !plot.readyToHarvest) {
            const timeSincePlanted = Date.now() - plot.plantedAt;
            const selectedSeed = seedsData.find(s => s.id === plot.plantType);
            
            if (!selectedSeed) return plot;

            // Konversi growthTime dari detik ke milidetik
            const totalGrowthTime = selectedSeed.growthTime * 1000;
            // Waktu pertumbuhan lebih cepat jika disiram
            const adjustedGrowthTime = plot.isWatered ? totalGrowthTime * 0.7 : totalGrowthTime;
            
            // Hitung progress berdasarkan waktu
            const progress = Math.min((timeSincePlanted / adjustedGrowthTime) * 100, 100);
            
            // Tentukan growth stage (0-3) berdasarkan progress
            const growthStage = Math.floor((progress / 100) * 3);
            
            return {
              ...plot,
              growthStage: growthStage,
              progress: progress,
              readyToHarvest: progress >= 100
            };
          }
          return plot;
        })
      );
    }, 1000); // Update setiap detik

    return () => clearInterval(growthInterval);
  }, [seedsData]); // Tambahkan seeds sebagai dependency

  useEffect(() => {
    // Check wallet connection when component mounts
    const checkInitialWalletConnection = async () => {
      const { solana } = window;
      
      if (solana?.isPhantom) {
        setShowWalletPrompt(!solana.isConnected);
      } else {
        setShowWalletPrompt(true);
      }
    };

    checkInitialWalletConnection();
  }, []);

  // Update showWalletPrompt when wallet connection status changes
  useEffect(() => {
    setShowWalletPrompt(!isWalletConnected);
  }, [isWalletConnected]);

  const createTokenAccount = async (connection, wallet) => {
    try {
      const associatedTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      console.log('Creating ATA on Helius mainnet:', associatedTokenAccount.toString());

      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet,
          associatedTokenAccount,
          wallet,
          TOKEN_MINT,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet;

      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
        preflightCommitment: 'confirmed'
      });

      console.log('Token account creation signature:', signature);
      await connection.confirmTransaction(signature, 'confirmed');
      return associatedTokenAccount;
    } catch (error) {
      console.error('Detailed error in createTokenAccount:', error);
      throw error;
    }
  };

  const checkBalance = async () => {
    try {
      const { solana } = window;
      if (!solana?.isConnected) return;

      const connection = getConnection();
      
      try {
        const tokenAccount = await getAssociatedTokenAddress(
          TOKEN_MINT,
          solana.publicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        console.log('Checking token account on Helius:', tokenAccount.toString());

        try {
          const accountInfo = await getAccount(connection, tokenAccount);
          const balance = Number(accountInfo.amount) / Math.pow(10, TOKEN_DECIMALS);
          console.log('Current balance:', balance);
          setUserBalance(balance);
        } catch (e) {
          if (e.name === 'TokenAccountNotFoundError') {
            console.log('Token account not found, creating...');
            toast.info('Creating your token account...');
            
            try {
              await createTokenAccount(connection, solana.publicKey);
              console.log('Token account created successfully');
              toast.success('Token account created!');
              setUserBalance(0);
            } catch (createError) {
              console.error('Failed to create token account:', createError);
              toast.error('Could not create token account');
              setUserBalance(0);
            }
          } else {
            console.error('Unexpected error:', e);
            toast.error('Error checking balance');
            setUserBalance(0);
          }
        }
      } catch (e) {
        console.error('Error in token account process:', e);
        setUserBalance(0);
      }
    } catch (error) {
      console.error("Error checking balance:", error);
      setUserBalance(0);
    }
  };

  // Add useEffect to check/create token account on wallet connect
  useEffect(() => {
    if (isWalletConnected) {
      checkBalance();
    }
  }, [isWalletConnected]);

  // Update purchaseSeed function
  const purchaseSeed = async (seedWithQuantity) => {
    const { quantity, ...seed } = seedWithQuantity;
    const totalPrice = seed.price * quantity;

    try {
      if (!isWalletConnected) {
        toast.error("Please connect your wallet first!");
        return;
      }

      const { solana } = window;
      const connection = getConnection();

      const buyerTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        solana.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const storeTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        STORE_WALLET,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      console.log('Attempting purchase on Helius mainnet');
      console.log('Buyer token account:', buyerTokenAccount.toString());
      console.log('Store token account:', storeTokenAccount.toString());
      console.log('Current balance:', userBalance);
      console.log('Total price:', totalPrice);
      console.log('Quantity:', quantity);

      if (userBalance < totalPrice) {
        toast.error(`Insufficient balance! You have ${formatBalance(userBalance)} testfun, needed: ${formatBalance(totalPrice)} testfun`);
        return;
      }

      const transaction = new Transaction();
      const transferAmount = new BN(totalPrice * Math.pow(10, TOKEN_DECIMALS));

      transaction.add(
        createTransferCheckedInstruction(
          buyerTokenAccount,
          TOKEN_MINT,
          storeTokenAccount,
          solana.publicKey,
          transferAmount.toNumber(),
          TOKEN_DECIMALS,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = solana.publicKey;

      const loadingToast = toast.loading("Processing purchase...");

      try {
        const signed = await solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: true,
          preflightCommitment: 'confirmed'
        });

        console.log('Transaction sent:', signature);
        await connection.confirmTransaction(signature, 'confirmed');

        setUserSeeds(prevSeeds => ({
          ...prevSeeds,
          [seed.id]: (prevSeeds[seed.id] || 0) + quantity
        }));

        await checkBalance();

        toast.update(loadingToast, {
          render: `Successfully purchased ${quantity} ${seed.name}${quantity > 1 ? 's' : ''}! ${seed.icon}`,
          type: "success",
          isLoading: false,
          autoClose: 3000
        });

      } catch (error) {
        console.error('Transaction error:', error);
        toast.update(loadingToast, {
          render: `Transaction failed: ${error.message}`,
          type: "error",
          isLoading: false,
          autoClose: 5000
        });
      }

    } catch (error) {
      console.error("Purchase error:", error);
      toast.error(`Purchase failed: ${error.message}`);
    }
  };

  // Add this helper function to format numbers
  const formatBalance = (balance) => {
    return Number(balance).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: TOKEN_DECIMALS
    });
  };

  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
    setCurrentAction(null);
  };

  const showHarvestNotification = (seedType, reward) => {
    setHarvestNotification({ seedType, reward });
    setTimeout(() => {
      setHarvestNotification(null);
    }, 3000); // Notifikasi akan hilang setelah 3 detik
  };

  // Fungsi untuk memberikan reward saat harvest
  const handleHarvest = async (plot, index) => {
    try {
      if (!plot.readyToHarvest) {
        toast.error("This plot is not ready to harvest!");
        return;
      }

      setHarvestingPlots(prev => ({ ...prev, [index]: true }));
      const connection = getConnection();
      const { solana } = window;
      
      console.log('Starting harvest process...');

      // Get user's token account
      const recipientTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        solana.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Get store's token account
      const storeTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        STORE_WALLET,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Find the planted seed data
      const plantedSeed = seedsData.find(seed => seed.id === plot.plantType);
      if (!plantedSeed) {
        throw new Error('Seed data not found');
      }

      // Calculate reward amount with decimals
      const rewardAmount = new BN(plantedSeed.reward * Math.pow(10, TOKEN_DECIMALS));

      console.log('Harvest details:', {
        recipientAccount: recipientTokenAccount.toString(),
        storeAccount: storeTokenAccount.toString(),
        reward: rewardAmount.toString(),
        seedType: plantedSeed.name
      });

      // Create transaction
      const transaction = new Transaction();

      // Add transfer instruction
      transaction.add(
        createTransferCheckedInstruction(
          storeTokenAccount,      // from (store's account)
          TOKEN_MINT,            // mint
          recipientTokenAccount, // to (user's account)
          STORE_WALLET,         // owner of from account
          rewardAmount.toNumber(),
          TOKEN_DECIMALS,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = solana.publicKey;

      const loadingToast = toast.loading("Processing harvest...");

      try {
        // Send transaction to server for store wallet signature
        const response = await fetch('http://localhost:3001/api/harvest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: solana.publicKey.toString(),
            plotIndex: index,
            plantType: plot.plantType,
            reward: plantedSeed.reward
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Server error');
        }

        const { transaction: signedSerializedTransaction } = await response.json();
        
        // Deserialize and sign transaction
        const signedTransaction = Transaction.from(
          Buffer.from(signedSerializedTransaction, 'base64')
        );

        // Sign with user's wallet
        const signed = await solana.signTransaction(signedTransaction);
        
        // Send signed transaction
        const signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });

        console.log('Transaction sent:', signature);

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        // Update plot state
        setPlots(prevPlots => {
          const newPlots = [...prevPlots];
          newPlots[index] = {
            ...plot,
            planted: false,
            plantType: null,
            growthStage: 0,
            plantedAt: null,
            readyToHarvest: false,
            isWatered: false
          };
          return newPlots;
        });

        // Show success message
        toast.update(loadingToast, {
          render: `Successfully harvested ${plantedSeed.name}! ${plantedSeed.icon}`,
          type: "success",
          isLoading: false,
          autoClose: 3000
        });

        // Show harvest success modal
        setHarvestSuccessInfo({
          plantName: plantedSeed.name,
          plantIcon: plantedSeed.icon,
          reward: plantedSeed.reward
        });
        setShowHarvestSuccess(true);

        // Update balance
        await checkBalance();

      } catch (error) {
        console.error('Harvest transaction error:', error);
        toast.update(loadingToast, {
          render: `Harvest failed: ${error.message}`,
          type: "error",
          isLoading: false,
          autoClose: 5000
        });

        // Reset plot state on error
        setPlots(prevPlots => {
          const newPlots = [...prevPlots];
          newPlots[index] = {
            ...plot,
            readyToHarvest: true
          };
          return newPlots;
        });
      }

    } catch (error) {
      console.error("Harvest error:", error);
      toast.error(`Harvest failed: ${error.message}`);
    } finally {
      setHarvestingPlots(prev => ({ ...prev, [index]: false }));
    }
  };

  // Update the constant
  const TOKENS_PER_PLOT = 50000; // 100,000 tokens needed per plot

  // Replace the validatePlot function
  const validatePlot = async (plotIndex) => {
    try {
      if (!isWalletConnected) {
        toast.error("Please connect your wallet first!");
        return false;
      }

      // Only check token balance for new plantings
      const availablePlots = Math.floor(userBalance / TOKENS_PER_PLOT);
      
      if (plotIndex >= availablePlots) {
        toast.error(
          `This plot is locked! You need ${TOKENS_PER_PLOT} testfun per plot. ` +
          `Current balance (${formatBalance(userBalance)} testfun) allows access to ${availablePlots} plots.`
        );
        return false;
      }

      return true;

    } catch (error) {
      console.error("Plot validation error:", error);
      toast.error(`Failed to validate plot: ${error.message}`);
      return false;
    }
  };

  // Update handlePlotClick function
  const handlePlotClick = async (index) => {
    // Add immediate logging
    console.log('Plot clicked - Initial check:', {
      index,
      currentAction,
      plotData: plots[index],
      isWalletConnected
    });

    if (!currentAction) {
      console.log('No current action selected');
      return;
    }

    if (!isWalletConnected) {
      toast.error("Please connect your wallet first!");
      return;
    }

    const plot = plots[index];

    // Detailed logging for harvest action
    if (currentAction === 'harvest') {
      console.log('Harvest action check:', {
        index,
        isPlanted: plot.planted,
        growthStage: plot.growthStage,
        readyToHarvest: plot.readyToHarvest,
        isHarvesting: harvestingPlots[index]
      });

      // Remove the validatePlot check for harvest
      if (plot.readyToHarvest && !harvestingPlots[index]) {
        console.log('Initiating harvest confirmation for plot:', index);
        setSelectedPlotForHarvest({ plot, index });
        setShowHarvestConfirm(true);
      } else {
        if (!plot.readyToHarvest) {
          toast.info("This plant is not ready to harvest yet!");
        } else if (harvestingPlots[index]) {
          toast.info("Harvest is already in progress!");
        }
      }
      return;
    }

    // For non-harvest actions, use validatePlot
    const isValidPlot = await validatePlot(index);
    if (!isValidPlot) {
      console.log(`Plot ${index} validation failed for ${currentAction} action`);
      return;
    }

    // Rest of the function for plant/water actions
    setPlots(prevPlots => {
      const newPlots = [...prevPlots];
      const plot = { ...newPlots[index] };

      switch(currentAction) {
        case 'plant':
          if (!plot.planted && selectedSeed) {
            // Check if user owns the selected seed
            const currentSeedCount = userSeeds[selectedSeed] || 0;
            
            if (currentSeedCount <= 0) {
              toast.error("You don't own this seed! Please purchase it from the store first.");
              return prevPlots;
            }

            try {
              // Plant the seed
              plot.planted = true;
              plot.plantType = selectedSeed;
              plot.growthStage = 0;
              plot.plantedAt = Date.now();
              plot.readyToHarvest = false;
              plot.isWatered = false;

              newPlots[index] = plot;

              // Update seeds count
              const updatedSeeds = {
                ...userSeeds,
                [selectedSeed]: currentSeedCount - 1
              };
              
              // Update state and save data atomically
              setUserSeeds(updatedSeeds);
              saveUserData(walletAddress, {
                seeds: updatedSeeds,
                plots: newPlots
              });

              return newPlots;
            } catch (error) {
              console.error("Error planting seed:", error);
              toast.error("Failed to plant seed. Please try again.");
              return prevPlots;
            }
          }
          return prevPlots;
          
        case 'water':
          if (plot.planted && !plot.isWatered && !plot.readyToHarvest) {
            plot.isWatered = true;
            plot.wateringAnimation = true;
            
            setTimeout(() => {
              setPlots(currentPlots => {
                const updatedPlots = [...currentPlots];
                updatedPlots[index] = {
                  ...updatedPlots[index],
                  wateringAnimation: false
                };
                return updatedPlots;
              });
            }, 1000);

            const timeSincePlanted = Date.now() - plot.plantedAt;
            const selectedSeed = seedsData.find(s => s.id === plot.plantType);
            if (selectedSeed) {
              const totalGrowthTime = selectedSeed.growthTime * 1000;
              const adjustedGrowthTime = totalGrowthTime * 0.7;
              const newProgress = Math.min((timeSincePlanted / adjustedGrowthTime) * 100, 100);
              plot.progress = newProgress;
              plot.growthStage = Math.floor((newProgress / 100) * 3);
              plot.readyToHarvest = newProgress >= 100;
            }
          }
          break;

        default:
          break;
      }

      newPlots[index] = plot;
      return newPlots;
    });
  };

  // Fungsi untuk handle konfirmasi harvest
  const handleHarvestConfirm = () => {
    if (selectedPlotForHarvest) {
      handleHarvest(selectedPlotForHarvest.plot, selectedPlotForHarvest.index);
      setShowHarvestConfirm(false);
      setSelectedPlotForHarvest(null);
    }
  };

  const handleHarvestCancel = () => {
    setShowHarvestConfirm(false);
    setSelectedPlotForHarvest(null);
  };

  const handleSuccessClose = useCallback(() => {
    setShowHarvestSuccess(false);
    setHarvestSuccessInfo(null);
  }, []);

  const renderGardenTools = () => (
    <div className="garden-tools">
      <div className="seed-selector">
        <button 
          className={`garden-tool ${currentAction === 'plant' ? 'active' : ''}`}
          onClick={() => {
            setCurrentAction('plant');
            setDropdownOpen(!dropdownOpen);
          }}
        >
          <span className="tool-icon">🌱</span>
          <span>Plant</span>
        </button>
        {currentAction === 'plant' && dropdownOpen && (
          <div className="seed-options">
            {seedsData.map(seed => (
              <button
                key={seed.id}
                className={`seed-option ${selectedSeed === seed.id ? 'selected' : ''} ${
                  !userSeeds[seed.id] || userSeeds[seed.id] <= 0 ? 'disabled' : ''
                }`}
                onClick={() => {
                  if (userSeeds[seed.id] && userSeeds[seed.id] > 0) {
                    setSelectedSeed(seed.id);
                    setDropdownOpen(false);
                  } else {
                    alert("You don't own this seed! Please purchase it from the store first.");
                  }
                }}
              >
                <span className="seed-icon">{seed.icon}</span>
                <span className="seed-name">{seed.name}</span>
                <span className="seed-owned">Owned: {userSeeds[seed.id] || 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button 
        className={`garden-tool ${currentAction === 'water' ? 'active' : ''}`}
        onClick={() => {
          setCurrentAction('water');
          setSelectedSeed(null);
          setDropdownOpen(false);
        }}
      >
        <span className="tool-icon">💧</span>
        <span>Water</span>
      </button>
      <button 
        className={`garden-tool ${currentAction === 'harvest' ? 'active' : ''}`}
        onClick={() => {
          setCurrentAction('harvest');
          setSelectedSeed(null);
          setDropdownOpen(false);
        }}
      >
        <span className="tool-icon">🌾</span>
        <span>Harvest</span>
      </button>
    </div>
  );

  const renderPlotProgress = (plot) => {
    const seed = seedsData.find(s => s.id === plot.plantType);
    
    return (
      <div className="plot-progress-popup">
        <div className="plot-progress-content">
          {/* ... rest of the popup content ... */}
          {plot.planted && (
            <div className="progress-section">
              <h4>Growth Progress</h4>
              <div className="detailed-progress-bar">
                <div 
                  className="detailed-progress-fill"
                  style={{ width: `${plot.progress}%` }}
                ></div>
                <div className="progress-stages">
                  <span className="stage-marker">🌱</span>
                  <span className="stage-marker">🌿</span>
                  <span className="stage-marker">🌳</span>
                  <span className="stage-marker">🌲</span>
                </div>
              </div>
              <div className="progress-text">
                {plot.progress.toFixed(1)}% Complete
              </div>
            </div>
          )}
          {/* ... rest of the popup content ... */}
        </div>
      </div>
    );
  };

  const renderHarvestNotification = () => {
    if (!harvestNotification) return null;

    return (
      <div className="harvest-notification">
        <div className="notification-content">
          <div className="notification-icon">
            {harvestNotification.seedType.icon}
          </div>
          <div className="notification-text">
            <h3>Harvest Success!</h3>
            <p>You harvested {harvestNotification.seedType.name}</p>
            <p className="reward-text">
              +{harvestNotification.reward} coins
            </p>
          </div>
        </div>
      </div>
    );
  };

  const WalletPrompt = () => (
    <div className="wallet-prompt">
      <div className="wallet-prompt-content">
        <div className="wallet-prompt-icon"></div>
        <h2>Connect Wallet Required</h2>
        <p>Please connect your Phantom wallet to access the game</p>
        <button onClick={connectWallet} className="connect-wallet-btn">
          {!window.solana?.isPhantom ? 'Install Phantom Wallet' : 'Connect Wallet'}
        </button>
      </div>
    </div>
  );

  // Add this new state to track quantities for all seeds
  const [seedQuantities, setSeedQuantities] = useState(
    Object.fromEntries(seedsData.map(seed => [seed.id, 1]))
  );

  // Add function to handle quantity changes
  const handleQuantityChange = (seedId, value) => {
    setSeedQuantities(prev => ({
      ...prev,
      [seedId]: Math.max(1, value)
    }));
  };

  const renderStoreContent = () => (
    <div className="store-wrapper">
      <div className="store-container">
        <div className="current-balance">
          Current Balance: {formatBalance(userBalance)} testfun
        </div>
        <div className="store-items">
          {seedsData.map(seed => {
            const quantity = seedQuantities[seed.id];
            const totalPrice = seed.price * quantity;
            
            return (
              <div key={seed.id} className="store-item">
                <div className="price-tag">
                 Price: {formatBalance(totalPrice)} testfun
                </div>
                <div className="seed-count">
                  Owned: {userSeeds[seed.id] || 0}
                </div>
                <div className="item-icon">{seed.icon}</div>
                <div className="item-details">
                  <h3>{seed.name}</h3>
                  <p>{seed.description}</p>
                  <p>Growth Time: {seed.growthTime}s</p>
                  <p>Reward: {formatBalance(seed.reward)} testfun</p>
                  <div className="quantity-selector">
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(seed.id, quantity - 1)}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        handleQuantityChange(seed.id, val);
                      }}
                      className="quantity-input"
                    />
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(seed.id, quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button 
                  className={`purchase-btn ${userBalance < totalPrice ? 'disabled' : ''}`}
                  onClick={() => purchaseSeed({ ...seed, quantity })}
                  disabled={userBalance < totalPrice}
                >
                  {userBalance < totalPrice ? 
                    `Need ${formatBalance(totalPrice - userBalance)} more testfun` : 
                    `Buy ${quantity} Seed${quantity > 1 ? 's' : ''}`}
                </button>
              </div>
            );
          })}
        </div>
        <ToastContainer 
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </div>
  );

  const renderContent = () => {
    switch(selectedTool) {
      case 'store':
        return renderStoreContent();
      case 'garden':
        return (
          <div className="garden-area">
            {renderGardenTools()}
            <div className="plots-container">
              <div className="fence fence-horizontal fence-top"></div>
              <div className="fence fence-horizontal fence-bottom"></div>
              <div className="fence fence-vertical fence-left"></div>
              <div className="fence fence-vertical fence-right"></div>
              
              <div className="plots-grid">
                {plots.map((plot, index) => (
                  <div
                    key={plot.id}
                    className={`plot 
                      ${plot.planted ? 'planted' : ''} 
                      ${plot.isWatered ? 'watered' : ''}
                      ${plot.wateringAnimation ? 'watering' : ''}
                      ${plot.readyToHarvest ? 'ready-harvest' : ''}
                      growth-stage-${plot.growthStage}`
                    }
                    onClick={() => handlePlotClick(index)}
                    onMouseEnter={() => setHoveredPlot(index)}
                    onMouseLeave={() => setHoveredPlot(null)}
                  >
                    {plot.planted && (
                      <div className="plant-sprite">
                        {plot.plantType && seedsData.find(s => s.id === plot.plantType)?.icon}
                      </div>
                    )}
                    {plot.wateringAnimation && <div className="water-droplets" />}
                    {plot.isWatered && <div className="water-effect" />}
                    {plot.readyToHarvest && <div className="harvest-effect" />}
                    
                    {hoveredPlot === index && plot.planted && (
                      <div className="plot-info-popup">
                        <div className="plot-info-content">
                          <div className="plot-info-header">
                            {seedsData.find(s => s.id === plot.plantType)?.icon}
                            <span className="plot-info-name">
                              {seedsData.find(s => s.id === plot.plantType)?.name} 
                            </span>
                          </div>
                          <div className="plot-info-details">
                            <div className="plot-info-row">
                              <span>Growth:</span>
                              <span>{plot.growthStage}/3</span>
                            </div>
                            <div className="plot-info-row">
                              <span>Status:</span>
                              <span>
                                {plot.readyToHarvest ? 'Ready to Harvest' : 
                                 plot.isWatered ? 'Watered' : 'Growing'}
                              </span>
                            </div>
                            <div className="plot-info-row">
                              <span>Reward:</span>
                              <span>{seedsData.find(s => s.id === plot.plantType)?.reward} coins</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'farm':
      case 'nft':
        return (
          <div className="coming-soon">
            <div className="coming-soon-content">
              <div className="coming-soon-icon">🚧</div>
              <h2>Coming Soon!</h2>
              <p>This feature is under development</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Update render to show loading state
  const renderPlot = (plot, index) => {
    const isHarvesting = harvestingPlots[index];
    const availablePlots = Math.floor(userBalance / TOKENS_PER_PLOT);
    const isLocked = !plot.planted && index >= availablePlots;
    
    return (
      <div 
        key={index} 
        className={`plot 
          ${plot.planted ? 'planted' : ''} 
          ${plot.readyToHarvest ? 'ready-harvest' : ''} 
          ${isHarvesting ? 'harvesting' : ''}
          ${isLocked ? 'locked' : ''}
          ${currentAction === 'harvest' && plot.readyToHarvest ? 'harvest-available' : ''}
        `}
        onClick={() => handlePlotClick(index)}
        onMouseEnter={() => console.log(`Plot ${index} hover - Status:`, {
          planted: plot.planted,
          readyToHarvest: plot.readyToHarvest,
          currentAction
        })}
      >
        {isLocked ? (
          <div className="locked-overlay">
            <span className="lock-icon">🔒</span>
            <span className="tokens-needed">
              {formatBalance(TOKENS_PER_PLOT)} testfun
            </span>
          </div>
        ) : (
          plot.planted && (
            <div className="plant-info">
              <div className="plant-icon">
                {seedsData.find(seed => seed.id === plot.plantType)?.icon || '🌱'}
              </div>
              <div className="growth-stage">
                Stage: {plot.growthStage}
              </div>
              {plot.readyToHarvest && (
                <div className="harvest-status">
                  {isHarvesting ? (
                    <>
                      <div className="loading-indicator">🔄</div>
                      <div className="loading-text">Harvesting...</div>
                    </>
                  ) : (
                    '✨ Ready to Harvest!'
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>
    );
  };

  // Add CSS for loading state
  const styles = `
    .loading-indicator {
      animation: spin 1s linear infinite;
      color: #FFD700;
      font-weight: bold;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .plot.ready:not(.harvesting):hover {
      cursor: pointer;
      transform: scale(1.05);
      transition: transform 0.2s;
    }

    .plot.harvesting {
      pointer-events: none;
      opacity: 0.8;
    }

    .plot.locked {
      background-color: rgba(0, 0, 0, 0.5);
      cursor: not-allowed;
    }

    .locked-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #fff;
      text-align: center;
    }

    .lock-icon {
      font-size: 24px;
      margin-bottom: 5px;
    }

    .tokens-needed {
      font-size: 12px;
      color: #ccc;
    }

    .quantity-selector {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 10px 0;
      gap: 8px;
    }

    .quantity-btn {
      background: #2a2a2a;
      border: 1px solid #4a4a4a;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: all 0.2s;
    }

    .quantity-btn:hover {
      background: #3a3a3a;
    }

    .quantity-btn:active {
      transform: scale(0.95);
    }

    .quantity-input {
      width: 50px;
      height: 30px;
      text-align: center;
      background: #2a2a2a;
      border: 1px solid #4a4a4a;
      color: white;
      border-radius: 4px;
      font-size: 14px;
    }

    .quantity-input::-webkit-inner-spin-button,
    .quantity-input::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .quantity-input {
      -moz-appearance: textfield;
    }
  `;

  // Add style tag to head
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  // Add CSS for toast customization
  const toastStyles = `
    .Toastify__toast {
      border-radius: 8px;
      background: #2a2a2a;
      color: #fff;
    }

    .Toastify__toast--success {
      background: #2a2a2a;
      border: 1px solid #4caf50;
    }

    .Toastify__toast--error {
      background: #2a2a2a;
      border: 1px solid #f44336;
    }

    .Toastify__toast--loading {
      background: #2a2a2a;
      border: 1px solid #2196f3;
    }

    .Toastify__progress-bar {
      background: #4caf50;
    }

    .Toastify__toast-icon {
      font-size: 20px;
    }
  `;

  const toastStyleSheet = document.createElement("style");
  toastStyleSheet.innerText = toastStyles;
  document.head.appendChild(toastStyleSheet);

  // Load user data when component mounts
  useEffect(() => {
    const loadSavedData = async () => {
      if (isWalletConnected && walletAddress) {
        try {
          const userData = await loadUserData(walletAddress);
          if (userData) {
            if (userData.seeds) {
              setUserSeeds(userData.seeds);
            }
            if (userData.plots) {
              setPlots(userData.plots);
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          toast.error('Failed to load your farm data');
        }
      }
    };

    loadSavedData();
  }, [isWalletConnected, walletAddress]);

  // Save data whenever state changes
  useEffect(() => {
    const saveData = async () => {
      if (isWalletConnected && walletAddress) {
        try {
          const dataToSave = {
            seeds: userSeeds,
            plots: plots
          };
          
          await saveUserData(walletAddress, dataToSave);
        } catch (error) {
          console.error('Error saving data:', error);
          toast.error('Failed to save your farm data');
        }
      }
    };

    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [userSeeds, plots, isWalletConnected, walletAddress]);

  const handleDisconnect = () => {
    if (walletAddress) {
      // Reset local state saja
      setUserSeeds({});
      setPlots(Array(20).fill().map((_, index) => ({ 
        id: index,
        planted: false,
        plantType: null,
        growthStage: 0,
        isWatered: false,
        plantedAt: null,
        readyToHarvest: false
      })));
    }
    disconnectWallet();
  };

  // Update useEffect
  useEffect(() => {
    const checkNetworkAndWallet = async () => {
      const { solana } = window;
      if (solana?.isConnected) {
        try {
          const connection = getConnection();
          await connection.getVersion();
          console.log('Connected to Solana mainnet');
          await checkBalance();
        } catch (error) {
          console.error('Network check error:', error);
          toast.error('Connection error. Please try again later.');
        }
      }
    };

    checkNetworkAndWallet();
  }, [isWalletConnected]);

  // Add useEffect to monitor plot states
  useEffect(() => {
    console.log('Current plots state:', plots.map((plot, index) => ({
      index,
      planted: plot.planted,
      plantType: plot.plantType,
      growthStage: plot.growthStage,
      readyToHarvest: plot.readyToHarvest,
      isWatered: plot.isWatered
    })));
  }, [plots]);

  return (
    <div className="join-container">
      <Header />
      {isWalletConnected && (
        <WalletInfo 
          walletAddress={walletAddress} 
          onDisconnect={handleDisconnect} 
        />
      )}
      {showWalletPrompt ? (
        <WalletPrompt />
      ) : (
        <>
          <div className="tools-container">
            <div className="tools-bar">
              {tools.map(tool => (
                <button
                  key={tool.id}
                  className={`tool-btn ${selectedTool === tool.id ? 'selected' : ''}`}
                  onClick={() => handleToolSelect(tool.id)}
                >
                  <span className="tool-icon">{tool.icon}</span>
                  <span className="tool-name">{tool.name}</span>
                </button>
              ))}
            </div>
          </div>
          {renderHarvestNotification()}
          {renderContent()}
        </>
      )}
      {showHarvestConfirm && selectedPlotForHarvest && (
        <HarvestConfirmPopup
          plantName={seedsData.find(seed => seed.id === selectedPlotForHarvest.plot.plantType)?.name || 'plant'}
          plantIcon={seedsData.find(seed => seed.id === selectedPlotForHarvest.plot.plantType)?.icon || '🌱'}
          onConfirm={handleHarvestConfirm}
          onCancel={handleHarvestCancel}
        />
      )}
      {showHarvestSuccess && harvestSuccessInfo && (
        <HarvestSuccessPopup
          plantName={harvestSuccessInfo.plantName}
          plantIcon={harvestSuccessInfo.plantIcon}
          reward={harvestSuccessInfo.reward}
          onClose={handleSuccessClose}
        />
      )}
      <WalletNotification notification={notification} />
      <Footer />
      <ToastContainer 
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        limit={3}
      />
    </div>
  );
};


export default Join; 