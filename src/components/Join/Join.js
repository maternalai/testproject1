import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import WalletInfo from '../WalletInfo/WalletInfo';
import './Join.css';
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { seeds } from '../../constants/seeds'; // Import seeds dari file constants
import { getStoreWallet, getNetwork } from '../../utils/storeWallet';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Add Buffer to window object
window.Buffer = Buffer;

// Pindahkan WalletNotification ke luar komponen Join
const WalletNotification = ({ notification }) => {
  if (!notification) return null;
  
  return (
    <div className={`wallet-notification ${notification.isError ? 'error' : 'success'}`}>
      {notification.message}
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
  const STORE_WALLET = new PublicKey('BjRqc12wBARLf1ja7Rxax3asFcx1ND7yPcyiSwABWawP'); // Contoh alamat wallet
  const [harvestingPlots, setHarvestingPlots] = useState({}); // Track harvesting state per plot

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
    { id: 'nft', name: 'NFT MARKET', icon: '����' }
  ];

  useEffect(() => {
    const growthInterval = setInterval(() => {
      setPlots(prevPlots => 
        prevPlots.map(plot => {
          if (plot.planted && !plot.readyToHarvest) {
            const timeSincePlanted = Date.now() - plot.plantedAt;
            const selectedSeed = seeds.find(s => s.id === plot.plantType);
            
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
  }, [seeds]); // Tambahkan seeds sebagai dependency

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

  // Fungsi untuk mengecek balance SOL
  const checkBalance = async () => {
    try {
      const { solana } = window;
      if (!solana?.isConnected) return;

      // Menggunakan testnet connection
      const connection = new Connection(
        clusterApiUrl(getNetwork()),
        'confirmed'
      );
      const balance = await connection.getBalance(solana.publicKey);
      
      // Convert lamports to SOL
      const solBalance = balance / LAMPORTS_PER_SOL;
      setUserBalance(solBalance);
      
      console.log('Current balance:', solBalance);
    } catch (error) {
      console.error("Error checking balance:", error);
    }
  };

  // Check balance when component mounts and when wallet connection changes
  useEffect(() => {
    if (isWalletConnected) {
      checkBalance();
      
      // Set up interval to check balance periodically
      const intervalId = setInterval(checkBalance, 5000); // Check every 5 seconds
      
      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
    } else {
      setUserBalance(0); // Reset balance when wallet disconnects
    }
  }, [isWalletConnected]);

  // Listen for wallet connection changes
  useEffect(() => {
    if (window.solana) {
      window.solana.on('connect', () => {
        console.log("Wallet connected");
        checkBalance();
      });
      
      window.solana.on('disconnect', () => {
        console.log("Wallet disconnected");
        setUserBalance(0);
      });

      // Cleanup listeners
      return () => {
        window.solana.removeAllListeners('connect');
        window.solana.removeAllListeners('disconnect');
      };
    }
  }, []);

  // Fungsi untuk membeli bibit
  const purchaseSeed = async (seed) => {
    try {
      if (!isWalletConnected) {
        toast.error("Please connect your wallet first!");
        return;
      }

      const { solana } = window;
      if (!solana?.isConnected) {
        toast.error("Wallet not connected!");
        return;
      }

      // Create connection to devnet
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

      try {
        // Get real-time balance
        const currentBalance = await connection.getBalance(solana.publicKey);
        console.log('Current balance (lamports):', currentBalance);
        console.log('Seed price (lamports):', seed.price);

        // Calculate fees and minimum balance
        const minimumFee = 5000; // Standard network fee
        const minimumBalance = 890880; // Minimum account balance
        const totalCost = seed.price + minimumFee;

        // Check if transaction would leave enough SOL
        if (currentBalance - totalCost < minimumBalance) {
          alert(`Insufficient balance. Please maintain minimum ${(minimumBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL in your account`);
          return;
        }

        // Get latest blockhash
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        
        // Create transaction with lower compute unit limit
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: solana.publicKey,
            toPubkey: STORE_WALLET,
            lamports: seed.price,
          })
        );

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = solana.publicKey;

        // Send and confirm transaction
        const signed = await solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: true, // Skip preflight to avoid insufficient balance checks
          maxRetries: 5
        });

        console.log('Transaction sent:', signature);

        // Show loading toast while confirming
        const loadingToast = toast.loading("Processing purchase...");

        const confirmation = await connection.confirmTransaction(signature, {
          commitment: 'confirmed'
        });

        if (confirmation.value.err) {
          // Update loading toast to error
          toast.update(loadingToast, {
            render: "Transaction failed to confirm",
            type: "error",
            isLoading: false,
            autoClose: 5000
          });
          throw new Error('Transaction failed to confirm');
        }

        // Update user's seed inventory
        setUserSeeds(prev => ({
          ...prev,
          [seed.id]: (prev[seed.id] || 0) + 1
        }));

        // Update balance
        await checkBalance();

        // Update loading toast to success
        toast.update(loadingToast, {
          render: `Successfully purchased ${seed.name}! 🌱`,
          type: "success",
          isLoading: false,
          autoClose: 5000,
          icon: seed.icon
        });

      } catch (error) {
        console.error('Transaction error:', error);
        toast.error(`Transaction failed: ${error.message}`);
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error(`Purchase failed: ${error.message}`);
    }
  };

  // Rename from useSeed to decrementSeedCount
  const decrementSeedCount = (seedId) => {
    setUserSeeds(prev => ({
      ...prev,
      [seedId]: Math.max(0, (prev[seedId] || 0) - 1)
    }));
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
    // Prevent multiple harvests
    if (harvestingPlots[index]) {
      toast.warn('Already harvesting this plot!', {
        position: "top-center",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }

    try {
      setHarvestingPlots(prev => ({ ...prev, [index]: true }));

      if (!isWalletConnected) {
        toast.error("Please connect your wallet first!", {
          position: "top-center",
          autoClose: 3000,
          theme: "dark"
        });
        setHarvestingPlots(prev => ({ ...prev, [index]: false }));
        return;
      }

      const plantedSeed = seeds.find(seed => seed.id === plot.plantType);
      if (!plantedSeed) {
        toast.error("Plant type not found!", {
          position: "top-center",
          autoClose: 3000,
          theme: "dark"
        });
        setHarvestingPlots(prev => ({ ...prev, [index]: false }));
        return;
      }

      const connection = new Connection(clusterApiUrl(getNetwork()), 'confirmed');

      try {
        let storeWallet = getStoreWallet();
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        const rewardLamports = Math.floor(plantedSeed.reward * LAMPORTS_PER_SOL);

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: storeWallet.publicKey,
            toPubkey: window.solana.publicKey,
            lamports: rewardLamports,
          })
        );

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = storeWallet.publicKey;
        transaction.sign(storeWallet);

        // Send transaction
        const signature = await connection.sendRawTransaction(
          transaction.serialize(),
          { skipPreflight: false }
        );

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');

        if (confirmation.value.err) {
          throw new Error('Transaction failed to confirm');
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

        // Update balance
        await checkBalance();

        // Show success notification
        toast.success(
          <div style={{ padding: '10px' }}>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>
              🎉 Harvest Successful! {plantedSeed.icon}
            </div>
            <div style={{ fontSize: '14px', color: '#4CAF50' }}>
              Received: {plantedSeed.reward} SOL
            </div>
          </div>,
          {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            style: {
              background: '#2a2a2a',
              border: '1px solid #4CAF50',
              borderRadius: '8px'
            }
          }
        );

      } catch (error) {
        console.error('Harvest error:', error);
        toast.error(`Harvest failed: ${error.message}`, {
          position: "top-center",
          autoClose: 5000,
          theme: "dark",
          style: {
            background: '#2a2a2a',
            border: '1px solid #f44336',
            borderRadius: '8px'
          }
        });
      }
    } catch (error) {
      console.error("Top level harvest error:", error);
      toast.error(`Harvest process failed: ${error.message}`, {
        position: "top-center",
        autoClose: 5000,
        theme: "dark"
      });
    } finally {
      setHarvestingPlots(prev => ({ ...prev, [index]: false }));
    }
  };

  // Update handlePlotClick
  const handlePlotClick = (index) => {
    if (!currentAction) return;

    setPlots(prevPlots => {
      const newPlots = [...prevPlots];
      const plot = { ...newPlots[index] };

      switch(currentAction) {
        case 'plant':
          if (!plot.planted && selectedSeed) {
            // Check if user owns the selected seed
            if (!userSeeds[selectedSeed] || userSeeds[selectedSeed] <= 0) {
              alert("You don't own this seed! Please purchase it from the store first.");
              return prevPlots;
            }

            // Use the seed
            decrementSeedCount(selectedSeed);
            
            // Plant the seed
            plot.planted = true;
            plot.plantType = selectedSeed;
            plot.growthStage = 0;
            plot.plantedAt = Date.now();
            plot.readyToHarvest = false;
            plot.isWatered = false;
          }
          break;

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
            const selectedSeed = seeds.find(s => s.id === plot.plantType);
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

        case 'harvest':
          if (plot.readyToHarvest) {
            handleHarvest(plot, index);
            return prevPlots; // Return existing plots as handleHarvest will update state
          }
          break;

        default:
          break;
      }

      newPlots[index] = plot;
      return newPlots;
    });
  };

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
            {seeds.map(seed => (
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
    const seed = seeds.find(s => s.id === plot.plantType);
    
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
        <div className="wallet-prompt-icon">👛</div>
        <h2>Connect Wallet Required</h2>
        <p>Please connect your Phantom wallet to access the game</p>
        <button onClick={connectWallet} className="connect-wallet-btn">
          {!window.solana?.isPhantom ? 'Install Phantom Wallet' : 'Connect Wallet'}
        </button>
      </div>
    </div>
  );

  const renderStoreContent = () => (
    <div className="store-container">
      <div className="store-balance">
        <span>Balance: {userBalance.toFixed(6)} SOL</span>
        <button 
          className="refresh-balance-btn"
          onClick={checkBalance}
        >
          🔄
        </button>
      </div>
      <div className="store-info">
        <small>Note: Maintain minimum SOL balance for network fees</small>
      </div>
      <div className="store-items">
        {seeds.map(seed => {
          const totalCost = (seed.price + 5000) / LAMPORTS_PER_SOL;
          return (
            <div key={seed.id} className="store-item">
              <div className="price-tag">
                {(seed.price / LAMPORTS_PER_SOL).toFixed(6)} SOL
                <small> + fees</small>
              </div>
              <div className="seed-count">
                Owned: {userSeeds[seed.id] || 0}
              </div>
              <div className="item-icon">{seed.icon}</div>
              <div className="item-details">
                <h3>{seed.name}</h3>
                <p>{seed.description}</p>
                <p>Growth Time: {seed.growthTime}s</p>
                <p>Reward: {seed.reward} SOL</p>
              </div>
              <button 
                className={`purchase-btn ${userBalance < totalCost ? 'disabled' : ''}`}
                onClick={() => purchaseSeed(seed)}
                disabled={userBalance < totalCost}
              >
                {userBalance < totalCost ? 'Insufficient SOL' : 'Buy Seed'}
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
                        {plot.plantType && seeds.find(s => s.id === plot.plantType)?.icon}
                      </div>
                    )}
                    {plot.wateringAnimation && <div className="water-droplets" />}
                    {plot.isWatered && <div className="water-effect" />}
                    {plot.readyToHarvest && <div className="harvest-effect" />}
                    
                    {hoveredPlot === index && plot.planted && (
                      <div className="plot-info-popup">
                        <div className="plot-info-content">
                          <div className="plot-info-header">
                            {seeds.find(s => s.id === plot.plantType)?.icon}
                            <span className="plot-info-name">
                              {seeds.find(s => s.id === plot.plantType)?.name}
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
                              <span>{seeds.find(s => s.id === plot.plantType)?.reward} coins</span>
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
    
    return (
      <div 
        key={index} 
        className={`plot ${plot.planted ? 'planted' : ''} ${plot.readyToHarvest ? 'ready' : ''} ${isHarvesting ? 'harvesting' : ''}`}
        onClick={() => handlePlotClick(index)}
      >
        {plot.planted && (
          <div className="plant-info">
            <div className="plant-icon">
              {seeds.find(seed => seed.id === plot.plantType)?.icon || '🌱'}
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

  return (
    <div className="join-container">
      <Header />
      {isWalletConnected && (
        <WalletInfo 
          walletAddress={walletAddress} 
          onDisconnect={disconnectWallet} 
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