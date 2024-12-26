import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export const getStoreWallet = () => {
  try {
    const privateKey = process.env.REACT_APP_STORE_PRIVATE_KEY;
    console.log('Environment check:', {
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey?.length
    });

    if (!privateKey) {
      throw new Error('Store wallet private key not found in environment variables');
    }

    try {
      // Decode private key dari base58
      const decodedKey = bs58.decode(privateKey);
      console.log('Decoded key length:', decodedKey.length);

      // Validate decoded key length
      if (decodedKey.length !== 64) {
        throw new Error(`Invalid key length: ${decodedKey.length}. Expected 64 bytes.`);
      }

      // Create keypair dari decoded private key
      const keypair = Keypair.fromSecretKey(decodedKey);
      console.log('Store wallet public key:', keypair.publicKey.toString());
      
      return keypair;
    } catch (decodeError) {
      console.error('Error decoding private key:', decodeError);
      throw new Error('Invalid private key format');
    }
  } catch (error) {
    console.error('Error creating store wallet:', error);
    throw error;
  }
};

// Helper function untuk mendapatkan network
export const getNetwork = () => {
  const network = process.env.REACT_APP_NETWORK || 'devnet';
  console.log('Current network:', network);
  return network;
}; 