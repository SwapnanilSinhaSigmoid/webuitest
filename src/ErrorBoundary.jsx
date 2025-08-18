import React from 'react';
import { MessageBar, MessageBarType, Text, Stack } from '@fluentui/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          background: '#f3f2f1'
        }}>
          <Stack tokens={{ childrenGap: 16 }} style={{ maxWidth: 500, width: '100%' }}>
            <MessageBar messageBarType={MessageBarType.error}>
              Something went wrong. Please refresh the page.
            </MessageBar>
            <Text variant="medium">
              Error: {this.state.error?.message || 'Unknown error occurred'}
            </Text>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                padding: '8px 16px',
                background: '#0078d4',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </Stack>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
