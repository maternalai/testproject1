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

    const connection = getConnection();
    const recipientWallet = new PublicKey(walletAddress);
    
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

    // Create and sign transaction
    const transaction = new Transaction();
    const rewardAmount = Math.floor(reward * Math.pow(10, TOKEN_DECIMALS));

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

    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = recipientWallet;
    transaction.sign(storeWalletKeypair);

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false
    }).toString('base64');

    console.log('Transaction ready for client signing');
    res.json({
      success: true,
      transaction: serializedTransaction
    });

  } catch (error) {
    console.error('Harvest error:', error);
    res.status(500).json({
      success: false,
      error: error.message
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