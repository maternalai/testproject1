require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection Options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Test route (before MongoDB connection)
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Connect to MongoDB
console.log('Connecting to MongoDB...'); // Debug log
mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    
    // Start server only after successful MongoDB connection
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
});

// MongoDB Schema
const GameDataSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  gameData: { type: Object, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const GameData = mongoose.model('GameData', GameDataSchema);

// Game data routes
app.post('/api/game-data/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const gameData = req.body;
    console.log('Received request:', { walletAddress, gameData }); // Debug log

    const result = await GameData.findOneAndUpdate(
      { walletAddress },
      { gameData, updatedAt: Date.now() },
      { upsert: true, new: true }
    );

    console.log('Saved result:', result); // Debug log
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Save error:', error); // Debug log
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/game-data/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const userData = await GameData.findOne({ walletAddress });
    res.json(userData ? userData.gameData : null);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
}); 