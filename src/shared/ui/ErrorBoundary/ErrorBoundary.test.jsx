import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function Bomb() {
  throw new Error('boom de render');
}

describe('ErrorBoundary', () => {
  it('renderiza a sus hijos cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <p>Contenido sano</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('Contenido sano')).toBeInTheDocument();
  });

  it('muestra la pantalla de recuperación cuando un hijo lanza', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recargar página' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver al inicio' })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('vuelve al inicio actualizando el hash', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }));

    expect(window.location.hash).toBe('#/');
    // El hijo sigue fallando, así que la barrera vuelve a capturarlo.
    expect(screen.getByRole('alert')).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
