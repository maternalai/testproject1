import express from 'express';
import cors from 'cors';
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { 
  createTransferCheckedInstruction, 
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Enable CORS for your frontend domain
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
});

// Constants
const MAINNET_RPC_URL = "https://mainnet.helius-rpc.com/?api-key=1db05468-e227-45cf-bd9f-cea0534b1f18";
const TOKEN_MINT = new PublicKey('9m9dqnnQzFTd5tycT2XdnfPW5NKVVkoSmx4o1iu6pump');
const TOKEN_DECIMALS = 6;
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

// Initialize leaderboard data structure
let leaderboardData = new Map();

// Add this function to manage leaderboard data
const updateLeaderboard = async (walletAddress, harvestAmount) => {
  if (!leaderboardData.has(walletAddress)) {
    leaderboardData.set(walletAddress, {
      walletAddress,
      totalHarvests: 0,
      totalRewards: 0
    });
  }

  const userData = leaderboardData.get(walletAddress);
  userData.totalHarvests += 1;
  userData.totalRewards += harvestAmount;

  // Save to file
  try {
    const dataToSave = Array.from(leaderboardData.values());
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(dataToSave, null, 2));
  } catch (error) {
    console.error('Error saving leaderboard:', error);
  }
};

// Validate environment variables
if (!process.env.STORE_WALLET_PRIVATE_KEY) {
  console.error('STORE_WALLET_PRIVATE_KEY is not set in environment variables');
  process.exit(1);
}

let storeWalletKeypair;
try {
  const privateKeyString = process.env.STORE_WALLET_PRIVATE_KEY;
  const privateKeyBytes = bs58.decode(privateKeyString);
  storeWalletKeypair = Keypair.fromSecretKey(privateKeyBytes);
  console.log('Store wallet loaded successfully:', storeWalletKeypair.publicKey.toString());
} catch (error) {
  console.error('Failed to load store wallet:', error);
  process.exit(1);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add this endpoint for getting leaderboard data
app.get('/api/leaderboard', async (req, res) => {
  try {
    let data;
    try {
      const fileContent = await fs.readFile(LEADERBOARD_FILE, 'utf-8');
      data = JSON.parse(fileContent);
    } catch (error) {
      // If file doesn't exist or is invalid, return empty array
      data = [];
    }

    // Sort by total rewards in descending order
    const sortedData = data.sort((a, b) => b.totalRewards - a.totalRewards);

    res.json(sortedData);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard data'
    });
  }
});

// Harvest endpoint
app.post('/api/harvest', async (req, res) => {
  console.log('=== START HARVEST REQUEST ===');
  console.log('Received harvest request:', req.body);
  
  try {
    const { walletAddress, plotIndex, plantType, reward } = req.body;

    // Validate input
    if (!walletAddress || !plantType || !reward) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Update leaderboard with this harvest
    await updateLeaderboard(walletAddress, reward);

    console.log('Creating connection...');
    const connection = getConnection();
    const recipientWallet = new PublicKey(walletAddress);
    
    console.log('Getting token accounts...');
    // Get token accounts
    const recipientTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      recipientWallet,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const storeTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      storeWalletKeypair.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log('Token accounts:', {
      recipient: recipientTokenAccount.toString(),
      store: storeTokenAccount.toString()
    });

    // Check store token balance
    const storeAccount = await getAccount(connection, storeTokenAccount);
    console.log('Store token balance:', storeAccount.amount.toString());

    // Create transaction
    console.log('Creating transaction...');
    const transaction = new Transaction();
    const rewardAmount = Math.floor(reward * Math.pow(10, TOKEN_DECIMALS));

    console.log('Adding transfer instruction...', {
      amount: rewardAmount,
      from: storeTokenAccount.toString(),
      to: recipientTokenAccount.toString()
    });

    // Add transfer instruction
    transaction.add(
      createTransferCheckedInstruction(
        storeTokenAccount,
        TOKEN_MINT,
        recipientTokenAccount,
        storeWalletKeypair.publicKey,
        rewardAmount,
        TOKEN_DECIMALS,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Get latest blockhash
    console.log('Getting latest blockhash...');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = recipientWallet;

    console.log('Signing transaction with store wallet...');
    // Partially sign with store wallet
    transaction.partialSign(storeWalletKeypair);

    console.log('Serializing transaction...');
    // Serialize the transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false
    }).toString('base64');

    console.log('Transaction ready for client signing');
    res.json({
      success: true,
      transaction: serializedTransaction,
      message: 'Transaction created successfully',
      debug: {
        rewardAmount,
        recipientAccount: recipientTokenAccount.toString(),
        storeAccount: storeTokenAccount.toString(),
        blockhash
      }
    });

  } catch (error) {
    console.error('Harvest error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
  console.log('=== END HARVEST REQUEST ===');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

const getConnection = () => {
  return new Connection(MAINNET_RPC_URL, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000
  });
}; 