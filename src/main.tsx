import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Martha Fashion Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#FFFBF5',
          color: '#1A1A1A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #AA820A, #D4AF37, #F5D77F)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1A1A1A',
            fontWeight: 800,
            fontSize: '24px',
            marginBottom: '16px',
            boxShadow: '0 8px 20px rgba(212,175,55,0.25)'
          }}>
            M
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: '#1A1A1A' }}>
            Martha Fashion
          </h2>
          <p style={{ fontSize: '13px', color: '#7A726B', maxWidth: '320px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Une anomalie temporaire est survenue lors de l'affichage de la boutique.
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '100%',
            maxWidth: '280px'
          }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #F5D77F)',
                color: '#1A1A1A',
                fontWeight: 700,
                fontSize: '13px',
                padding: '12px 20px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(212,175,55,0.3)'
              }}
            >
              Réessayer
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                background: '#FFFFFF',
                color: '#7A726B',
                fontWeight: 600,
                fontSize: '11px',
                padding: '10px 16px',
                borderRadius: '9999px',
                border: '1px solid #EBDCD0',
                cursor: 'pointer'
              }}
            >
              Réinitialiser les données locales
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
