import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Função de inicialização
const initializeApp = () => {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root container not found');
  }

  const root = createRoot(container);
  
  // Remover StrictMode temporariamente para resolver problemas de renderização
  root.render(<App />);
  
  console.log('✅ App initialized successfully');
};

// Aguardar o DOM estar carregado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}