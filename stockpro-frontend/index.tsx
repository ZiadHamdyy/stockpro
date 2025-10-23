import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
);