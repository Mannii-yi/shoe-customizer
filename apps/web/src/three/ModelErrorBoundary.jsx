// =============================================================================
// apps/web/src/three/ModelErrorBoundary.jsx
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// A safety net around the real shoe model. If loading or reading the file
// fails (file missing, network error, broken file), React would normally break
// the whole scene. This catches the failure and shows a fallback instead (the
// placeholder box shoe), so the landing page and customizer keep working.
//
// WHY IT IS A CLASS
// React only supports catching errors in class components. This is the one
// place in the project where a class is the right tool.
// =============================================================================

import { Component } from 'react';


/**
 * Shows `children` normally; if anything below throws, shows `fallback`.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - What to show normally (the real shoe).
 * @param {React.ReactNode} props.fallback - What to show if the children fail.
 */
export class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  // React calls this when a child throws. Returning new state switches to the fallback.
  static getDerivedStateFromError() {
    return { failed: true };
  }

  // React calls this too, so we can write down what went wrong.
  componentDidCatch(error) {
    console.error(
      '[ModelErrorBoundary] The shoe model failed to load. Showing the placeholder shoe instead.',
      error,
    );
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}