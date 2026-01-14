import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import './index.css';
import App from './App';

// Suppress ResizeObserver errors permanently (harmless browser warning)
const isResizeObserverError = (error) => {
  const message = error?.message || error?.toString() || '';
  const errorString = typeof message === 'string' ? message : JSON.stringify(message);
  return (
    errorString.includes('ResizeObserver loop completed with undelivered notifications') ||
    errorString.includes('ResizeObserver loop limit exceeded') ||
    errorString.includes('ResizeObserver loop')
  );
};

// Handle window errors (capture phase - before React sees it)
window.addEventListener('error', (e) => {
  if (isResizeObserverError(e)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    return false;
  }
}, true);

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  if (isResizeObserverError(e.reason)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    return false;
  }
});

// Override console.error to suppress ResizeObserver errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.map(arg => 
    typeof arg === 'string' ? arg : 
    arg?.message || 
    arg?.toString() || 
    JSON.stringify(arg)
  ).join(' ');
  
  if (isResizeObserverError({ message })) {
    return; // Suppress the error completely
  }
  originalConsoleError.apply(console, args);
};

// Also override console.warn in case ResizeObserver errors come through there
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const message = args.map(arg => 
    typeof arg === 'string' ? arg : 
    arg?.message || 
    arg?.toString() || 
    JSON.stringify(arg)
  ).join(' ');
  
  if (isResizeObserverError({ message })) {
    return; // Suppress the warning
  }
  originalConsoleWarn.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

