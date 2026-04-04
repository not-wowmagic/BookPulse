import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * ErrorBoundary — Catches runtime errors in child components.
 * Shows a branded fallback UI instead of crashing the app.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center text-center bg-[#131313] border border-white/[0.07] rounded-2xl"
          style={{ padding: "4rem 2rem", minHeight: "20rem" }}
          role="alert"
        >
          <div className="w-16 h-16 bg-signal/10 rounded-2xl flex items-center justify-center mb-8">
            <AlertTriangle size={28} className="text-signal" aria-hidden="true" />
          </div>

          <h3 className="font-heading text-xl font-bold text-white mb-3 tracking-tight">
            {this.props.title || "Something went wrong"}
          </h3>

          <p className="font-data text-xs text-white/40 max-w-md leading-relaxed mb-8">
            {this.props.message ||
              "BookPulse encountered an unexpected error. The data feed may have interrupted. Try refreshing."}
          </p>

          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 bg-signal hover:bg-signal-dark text-white font-heading font-bold text-xs tracking-widest uppercase rounded-full border-2 border-signal hover:border-signal-dark transition-all duration-300 cursor-pointer"
            style={{ padding: "0.75rem 2rem", minWidth: "44px", minHeight: "44px" }}
            aria-label="Retry loading this section"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
