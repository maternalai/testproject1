import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './Join.css';

const Join = () => {
  const [selectedTool, setSelectedTool] = useState('store');
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [plots, setPlots] = useState(Array(20).fill().map((_, index) => ({ 
    id: index,
    tilled: false, 
    planted: false,
    plantType: null,
    growthStage: 0,
    isWatered: false,
    plantedAt: null,
    readyToHarvest: false
  })));
  const [hoveredPlot, setHoveredPlot] = useState(null);
  const [harvestNotification, setHarvestNotification] = useState(null);

  const tools = [
    { id: 'store', name: 'ITEM SHOP', icon: '🌱' },
    { id: 'garden', name: 'GARDEN AREA', icon: '🏠' },
    { id: 'farm', name: 'FARM', icon: '🚜' },
    { id: 'nft', name: 'NFT MARKET', icon: '💰' }
  ];

  const seeds = [
    // Basic Seeds
    { id: 'carrot', name: 'Carrot', icon: '🥕', growthTime: 30, price: 10, reward: 25 },
    { id: 'potato', name: 'Potato', icon: '🥔', growthTime: 45, price: 15, reward: 35 },
    { id: 'tomato', name: 'Tomato', icon: '🍅', growthTime: 60, price: 20, reward: 45 },
    { id: 'corn', name: 'Corn', icon: '🌽', growthTime: 50, price: 18, reward: 40 },
    { id: 'wheat', name: 'Wheat', icon: '🌾', growthTime: 35, price: 12, reward: 30 },
    
    // Advanced Seeds
    { id: 'strawberry', name: 'Strawberry', icon: '🍓', growthTime: 70, price: 25, reward: 60 },
    { id: 'eggplant', name: 'Eggplant', icon: '🍆', growthTime: 65, price: 22, reward: 55 },
    { id: 'pumpkin', name: 'Pumpkin', icon: '🎃', growthTime: 80, price: 30, reward: 75 },
    { id: 'watermelon', name: 'Watermelon', icon: '🍉', growthTime: 90, price: 35, reward: 85 },
    { id: 'grapes', name: 'Grapes', icon: '🍇', growthTime: 75, price: 28, reward: 70 },
    
    // Premium Seeds
    { id: 'goldApple', name: 'Golden Apple', icon: '🍎', growthTime: 120, price: 100, reward: 250 },
    { id: 'magicBean', name: 'Magic Bean', icon: '🌱', growthTime: 150, price: 200, reward: 500 },
    { id: 'starFruit', name: 'Star Fruit', icon: '⭐', growthTime: 180, price: 300, reward: 750 },
    { id: 'crystalFlower', name: 'Crystal Flower', icon: '💎', growthTime: 240, price: 500, reward: 1200 },
    { id: 'rainbowCorn', name: 'Rainbow Corn', icon: '🌈', growthTime: 200, price: 400, reward: 1000 }
  ];

  const storeItems = [
    // Tools
    { id: 1, name: 'Watering Can', icon: '💧', price: '100', description: 'Water your plants faster' },
    { id: 2, name: 'Fertilizer', icon: '🌿', price: '150', description: 'Speed up plant growth' },
    { id: 3, name: 'Golden Shovel', icon: '⛏️', price: '200', description: 'Premium tilling tool' },
    { id: 4, name: 'Magic Water', icon: '✨', price: '500', description: 'Instant growth boost' },
    { id: 5, name: 'Garden Tools', icon: '🔧', price: '300', description: 'Essential farming tools' },
    
    // Basic Seed Packs
    { id: 6, name: 'Basic Seed Pack', icon: '🌱', price: '50', description: 'Contains common seeds' },
    { id: 7, name: 'Veggie Pack', icon: '🥕', price: '100', description: 'Assorted vegetable seeds' },
    { id: 8, name: 'Fruit Pack', icon: '🍎', price: '150', description: 'Assorted fruit seeds' },
    
    // Premium Items
    { id: 9, name: 'Lucky Charm', icon: '🍀', price: '1000', description: 'Increase rare drops' },
    { id: 10, name: 'Time Crystal', icon: '⌛', price: '2000', description: 'Speed up time' },
    
    // Special Seed Packs
    { id: 11, name: 'Rare Seed Pack', icon: '🌟', price: '300', description: 'Contains rare seeds' },
    { id: 12, name: 'Magic Seed Pack', icon: '✨', price: '500', description: 'Contains magical seeds' },
    { id: 13, name: 'Premium Pack', icon: '💎', price: '1000', description: 'Premium quality seeds' },
    { id: 14, name: 'Rainbow Pack', icon: '🌈', price: '2000', description: 'Special rainbow seeds' },
    { id: 15, name: 'Crystal Pack', icon: '💫', price: '3000', description: 'Crystal plant seeds' },
    
    // Boosters
    { id: 16, name: 'Growth Boost', icon: '🚀', price: '250', description: 'Speeds up growth by 50%' },
    { id: 17, name: 'Yield Boost', icon: '📈', price: '300', description: 'Increases harvest yield' },
    { id: 18, name: 'Quality Boost', icon: '⭐', price: '400', description: 'Improves crop quality' },
    { id: 19, name: 'Weather Control', icon: '🌤️', price: '800', description: 'Control garden weather' },
    { id: 20, name: 'Auto Harvester', icon: '🤖', price: '1500', description: 'Automatic harvesting' }
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

  const handlePlotClick = (index) => {
    if (!currentAction) return;

    setPlots(prevPlots => {
      const newPlots = [...prevPlots];
      const plot = { ...newPlots[index] };

      try {
        switch(currentAction) {
          case 'till':
            if (!plot.planted) {
              plot.tilled = !plot.tilled;
              if (!plot.tilled) {
                plot.planted = false;
                plot.plantType = null;
                plot.growthStage = 0;
                plot.progress = 0;
                plot.isWatered = false;
                plot.plantedAt = null;
                plot.readyToHarvest = false;
              }
            }
            break;

          case 'plant':
            if (plot.tilled && !plot.planted && selectedSeed) {
              plot.planted = true;
              plot.plantType = selectedSeed;
              plot.growthStage = 0;
              plot.progress = 0;
              plot.plantedAt = Date.now();
              plot.readyToHarvest = false;
              plot.isWatered = false;
            }
            break;

          case 'water':
            if (plot.planted && !plot.isWatered && !plot.readyToHarvest) {
              plot.isWatered = true;
              // Recalculate progress when watered
              const timeSincePlanted = Date.now() - plot.plantedAt;
              const selectedSeed = seeds.find(s => s.id === plot.plantType);
              if (selectedSeed) {
                const totalGrowthTime = selectedSeed.growthTime * 1000;
                const adjustedGrowthTime = totalGrowthTime * 0.7; // 30% faster when watered
                const newProgress = Math.min((timeSincePlanted / adjustedGrowthTime) * 100, 100);
                plot.progress = newProgress;
                plot.growthStage = Math.floor((newProgress / 100) * 3);
                plot.readyToHarvest = newProgress >= 100;
              }
            }
            break;

          case 'harvest':
            if (plot.readyToHarvest) {
              const harvestedSeed = seeds.find(s => s.id === plot.plantType);
              if (harvestedSeed) {
                showHarvestNotification(harvestedSeed, harvestedSeed.reward);
              }
              
              // Reset plot after harvest
              plot.planted = false;
              plot.plantType = null;
              plot.growthStage = 0;
              plot.progress = 0;
              plot.isWatered = false;
              plot.plantedAt = null;
              plot.readyToHarvest = false;
              plot.tilled = false;
            }
            break;

          default:
            break;
        }

        newPlots[index] = plot;
        return newPlots;
      } catch (error) {
        console.error('Error handling plot click:', error);
        return prevPlots;
      }
    });
  };

  const renderGardenTools = () => (
    <div className="garden-tools">
      <button 
        className={`garden-tool ${currentAction === 'till' ? 'active' : ''}`}
        onClick={() => {
          setCurrentAction('till');
          setSelectedSeed(null);
          setDropdownOpen(false);
        }}
      >
        <span className="tool-icon">🚜</span>
        <span>Till</span>
      </button>
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
                className={`seed-option ${selectedSeed === seed.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedSeed(seed.id);
                  setDropdownOpen(false);
                }}
              >
                <span className="seed-icon">{seed.icon}</span>
                <span className="seed-name">{seed.name}</span>
                <span className="seed-price">{seed.price} coins</span>
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

  const renderContent = () => {
    switch(selectedTool) {
      case 'store':
        return (
          <div className="store-area">
            <div className="store-container">
              {storeItems.map(item => (
                <div key={item.id} className="store-item">
                  <div className="store-item-image">
                    <span className="item-icon">{item.icon}</span>
                  </div>
                  <div className="store-item-name">{item.name}</div>
                  <div className="store-item-description">{item.description}</div>
                  <div className="store-item-price">{item.price} coins</div>
                  <button className="buy-button">
                    <span className="buy-icon">🛒</span>
                    <span className="buy-text">BUY NOW</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
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
                      ${plot.tilled ? 'tilled' : ''} 
                      ${plot.planted ? 'planted' : ''} 
                      ${plot.isWatered ? 'watered' : ''}
                      ${plot.readyToHarvest ? 'ready-harvest' : ''}
                      growth-stage-${plot.growthStage}`
                    }
                    onClick={() => handlePlotClick(index)}
                    onMouseEnter={() => setHoveredPlot(index)}
                    onMouseLeave={() => setHoveredPlot(null)}
                  >
                    <div className="plot-dot"></div>
                    {plot.planted && (
                      <div className="plant-sprite">
                        {plot.plantType && seeds.find(s => s.id === plot.plantType)?.icon}
                      </div>
                    )}
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

  return (
    <div className="join-container">
      <Header />
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
      <Footer />
    </div>
  );
};

export default Join; 