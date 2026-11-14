import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import { SocketProvider } from './context/SocketContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <SocketProvider>
            <App />
            <Toaster position="top-center" toastOptions={{ style: { borderRadius: '14px', fontFamily: 'Poppins, sans-serif', fontSize: '14px' }, success: { iconTheme: { primary: '#7A1F1F', secondary: '#fff' } } }} />
          </SocketProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  </StrictMode>
);
