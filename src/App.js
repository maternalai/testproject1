import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Garden from './components/Garden/Garden';
import About from './components/About/About';
import Whitepaper from './components/Whitepaper/Whitepaper';
import Join from './components/Join/Join';
import MusicPlayer from './components/MusicPlayer/MusicPlayer';
import './App.css';
import { WalletProvider } from './context/WalletContext';
import { ErrorBoundary } from 'react-error-boundary';
import { GameProvider } from './context/GameContext';

function ErrorFallback({error}) {
  // Jika error dari ekstensi Chrome, jangan tampilkan apa-apa
  if (error.message?.includes('object.extension.inIncognitoContext')) {
    return null;
  }
  
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <WalletProvider>
        <GameProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Garden />} />
              <Route path="/about" element={<About />} />
              <Route path="/whitepaper" element={<Whitepaper />} />
              <Route path="/join" element={<Join />} />
            </Routes>
            <MusicPlayer />
          </Router>
        </GameProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
}

export default App;