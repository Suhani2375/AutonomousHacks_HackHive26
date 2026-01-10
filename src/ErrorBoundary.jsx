import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "20px",
          textAlign: "center",
          background: "#f9fafb"
        }}>
          <h1 style={{ color: "#ef4444", marginBottom: "16px" }}>⚠️ Something went wrong</h1>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              background: "#10b981",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            Reload Page
          </button>
          <details style={{ marginTop: "24px", textAlign: "left", maxWidth: "600px" }}>
            <summary style={{ cursor: "pointer", color: "#6b7280", marginBottom: "8px" }}>
              Error Details
            </summary>
            <pre style={{
              background: "#1f2937",
              color: "#f9fafb",
              padding: "16px",
              borderRadius: "8px",
              overflow: "auto",
              fontSize: "12px"
            }}>
              {this.state.error?.stack || this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
