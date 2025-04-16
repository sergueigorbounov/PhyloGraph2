import React from 'react';
import './PhyloTreeErrorBoundary.css'; // Optional: You can create this file for styling

/**
 * Error Boundary component for PhyloTree visualization
 * Catches errors that occur during rendering of the phylogenetic tree
 * and displays a user-friendly fallback UI instead of crashing the app
 */
class PhyloTreeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    };
  }

  /**
   * Static method called when an error is thrown during rendering
   * Returns the new state to be used for the next render
   */
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  /**
   * Lifecycle method called after an error has been caught
   * Use this for logging errors to an error reporting service
   */
  componentDidCatch(error, errorInfo) {
    // Log the error to console with additional context
    console.error('[PhyloTree] Error caught by boundary:', error);
    console.error('[PhyloTree] Component stack:', errorInfo.componentStack);
    
    // Update state with error details and increment error count
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset the error state to allow the component to try rendering again
   */
  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Call onReset prop if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    // If there's an error, show the fallback UI
    if (this.state.hasError) {
      return (
        <div className="phylo-tree-error-boundary">
          <div className="error-icon">⚠️</div>
          <h3>PhyloTree Visualization Error</h3>
          <p className="error-message">
            {this.state.error?.message || 'An unexpected error occurred while rendering the phylogenetic tree.'}
          </p>
          
          <div className="error-actions">
            <button 
              onClick={this.handleReset}
              className="retry-button"
            >
              Try Again
            </button>
            
            {this.props.fallbackComponent && (
              <button 
                onClick={this.props.onShowFallback}
                className="fallback-button"
              >
                Show Simple View
              </button>
            )}
          </div>
          
          {this.props.showDetails && this.state.errorInfo && (
            <details className="error-details">
              <summary>Technical Details</summary>
              <div className="error-technical">
                <p><strong>Error Type:</strong> {this.state.error?.name}</p>
                <p><strong>Error Count:</strong> {this.state.errorCount}</p>
                <pre className="error-stack">{this.state.error?.stack}</pre>
                <p><strong>Component Stack:</strong></p>
                <pre className="component-stack">{this.state.errorInfo.componentStack}</pre>
              </div>
            </details>
          )}
          
          {/* Render the fallback component if provided */}
          {this.props.fallbackComponent && (
            <div className="fallback-container">
              {this.props.fallbackComponent}
            </div>
          )}
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default PhyloTreeErrorBoundary;