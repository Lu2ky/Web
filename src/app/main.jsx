import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../shared/api/queryClient';
import ErrorBoundary from '../shared/ui/ErrorBoundary/ErrorBoundary.jsx';
import { ThemeProvider } from './providers/ThemeProvider.jsx';
import AppCoordinator from './router/AppCoordinator.jsx';
import '../shared/styles/tokens.css';
import '../shared/styles/themes.css';
import '../shared/styles/base.css';
import '../shared/styles/liquidGlass.css';
import '../shared/styles/glassComponents.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AppCoordinator />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);