/**
 * Error Boundary Component - Catches React component errors
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const COLORS = {
  bg: '#000000',
  surface: '#0D0D0D',
  red: '#E53935',
  text: '#FFFFFF',
  textMuted: '#666666',
  border: '#1F1F1F',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.red,
    marginBottom: 8,
    letterSpacing: 2,
  },
  message: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  button: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default ErrorBoundary;
