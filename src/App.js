import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Garden from './components/Garden/Garden';
import About from './components/About/About';
import Whitepaper from './components/Whitepaper/Whitepaper';
import Join from './components/Join/Join';
import MusicPlayer from './components/MusicPlayer/MusicPlayer';
import './App.css';
import { WalletProvider } from './context/WalletContext';

function App() {
  return (
    <WalletProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Garden />} />
          <Route path="/about" element={<About />} />
          <Route path="/whitepaper" element={<Whitepaper />} />
          <Route path="/join" element={<Join />} />
        </Routes>
        <MusicPlayer />
      </Router>
    </WalletProvider>
  );
}

export default App;