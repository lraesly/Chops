import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'

// Error boundary to catch any errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
          <h1 style={{ color: 'red' }}>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '10px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => {
              localStorage.removeItem('practiceLog_storagePath');
              window.location.reload();
            }}
            style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
          >
            Reset Storage & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global error handler
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', message, source, lineno, colno, error);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
