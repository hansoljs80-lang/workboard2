import React, { ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { UIProvider } from './context/UIContext';

console.log("Starting App Mount...");

// PWA Service Worker Registration
try {
  // @ts-ignore
  const swUrl = new URL('sw.js', import.meta.url);
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
} catch (e) {
  console.warn("Service Worker registration skipped", e);
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          backgroundColor: '#f8fafc',
          color: '#334155',
          textAlign: 'center'
        }}>
          <h1 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem'}}>앱 실행 중 오류가 발생했습니다</h1>
          <p style={{marginBottom: '1rem'}}>일시적인 문제일 수 있습니다. 새로고침을 시도해주세요.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            새로고침
          </button>
          <pre style={{
            backgroundColor: '#e2e8f0', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            overflow: 'auto', 
            maxWidth: '100%',
            fontSize: '0.8rem',
            textAlign: 'left'
          }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);