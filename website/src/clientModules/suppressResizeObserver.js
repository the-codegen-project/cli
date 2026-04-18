/**
 * Suppress ResizeObserver loop error.
 * This is a benign error from Monaco Editor that doesn't affect functionality.
 * Must run early before webpack-dev-server overlay captures it.
 */

// Suppress the error in the global error handler
const originalError = window.onerror;
window.onerror = function (message, source, lineno, colno, error) {
  if (message === 'ResizeObserver loop completed with undelivered notifications.') {
    return true; // Prevent default handling
  }
  if (originalError) {
    return originalError(message, source, lineno, colno, error);
  }
  return false;
};

// Also suppress via addEventListener
window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
    e.stopImmediatePropagation();
    e.preventDefault();
    return true;
  }
}, true); // Use capture phase to catch it early

// Suppress unhandled rejection for ResizeObserver
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message === 'ResizeObserver loop completed with undelivered notifications.') {
    e.preventDefault();
    return true;
  }
}, true);
