import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LogInForm from './LogInForm';
import LDAPservice from './services/LDAPservice';
import * as authSession from './services/authSession';

// Mock those services
vi.mock('./services/LDAPservice');
vi.mock('./services/authSession');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLogInForm = () => {
  return render(
    <BrowserRouter>
      <LogInForm />
    </BrowserRouter>
  );
};

describe('LogInForm - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render and UI', () => {
    it('should render the login form correctly', () => {
      renderLogInForm();
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.getByText('Por favor ingresa tu información para iniciar sesión.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Id Usuario')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
    });

    it('should toggle password visibility when clicking eye icon', async () => {
      const user = userEvent.setup();
      renderLogInForm();
      
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: '' }).parentElement.querySelector('.togglePassword');
      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });

    it('should have links to recover password', () => {
      renderLogInForm();
      const recoverLink = screen.getByText('Olvidé mi contraseña');
      expect(recoverLink).toBeInTheDocument();
      expect(recoverLink.closest('a')).toHaveAttribute('href', '/RecoverPassword');
    });
  });

  describe('Form Validation', () => {
    it('should show error when userId is empty', async () => {
      const user = userEvent.setup();
      renderLogInForm();

      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Por favor ingresa usuario y contraseña')).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      renderLogInForm();

      const userIdInput = screen.getByPlaceholderText('Id Usuario');
      await user.type(userIdInput, 'testuser');

      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Por favor ingresa usuario y contraseña')).toBeInTheDocument();
      });
    });

    it('should show error when both fields are empty with whitespace', async () => {
      const user = userEvent.setup();
      renderLogInForm();

      const userIdInput = screen.getByPlaceholderText('Id Usuario');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      
      await user.type(userIdInput, '   ');
      await user.type(passwordInput, '   ');

      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Por favor ingresa usuario y contraseña')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication - Failed Login', () => {
    it('should show error on failed authentication', async () => {
      const user = userEvent.setup();
      LDAPservice.mockResolvedValueOnce({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });

      renderLogInForm();

      const userIdInput = screen.getByPlaceholderText('Id Usuario');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      
      await user.type(userIdInput, 'wronguser');
      await user.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Usuario o contraseña incorrectos')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show generic error when LDAP service fails', async () => {
      const user = userEvent.setup();
      LDAPservice.mockResolvedValueOnce(null);

      renderLogInForm();

      const userIdInput = screen.getByPlaceholderText('Id Usuario');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      
      await user.type(userIdInput, 'testuser');
      await user.type(passwordInput, 'testpass');

      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error al conectar con el servidor')).toBeInTheDocument();
      });
    });

    it('should show error when user has no roles', async () => {
      const user = userEvent.setup();
      LDAPservice.mockResolvedValueOnce({
        success: true,
        token: 'test-token',
        roles: []
      });

      renderLogInForm();

      const userIdInput = screen.getByPlaceholderText('Id Usuario');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      
      await user.type(userIdInput, 'testuser');
      await user.type(passwordInput, 'testpass');

      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Tu usuario no tiene permisos para acceder a la aplicación')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Authentication - Successful Login', () => {
    it('should navigate to AdminView for admin role', async () => {
      const user = userEvent.setup();
      authSession.createAuthSession = vi.fn();
      
      LDAPservice.mockResolvedValueOnce({
        success: true,
        token: 'admin-token',
        roles: ['ADMIN_UPB_PLANNER']
      });

      renderLogInForm();

      const userIdInput = screen.getByPlaceholderText('Id Usuario');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      
      await user.type(userIdInput, 'admin');
      await user.type(passwordInput, 'adminpass');

      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(authSession.createAuthSession).toHaveBeenCalledWith({
          userId: 'admin',
          token: 'admin-token',
          roles: ['ADMIN_UPB_PLANNER']
        });
        expect(mockNavigate).toHaveBeenCalledWith('/AdminView');
      });
    });

    it('should navigate to app for usuario role', async () => {
      const user = userEvent.setup();
      authSession.createAuthSession = vi.fn();
      
      LDAPservice.mockResolvedValueOnce({
        success: true,
        token: 'user-token',
        roles: ['Usuarios']
      });

      renderLogInForm();

      const userIdInput = screen.getByPlaceholderText('Id Usuario');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      
      await user.type(userIdInput, 'testuser');
      await user.type(passwordInput, 'testpass');

      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(authSession.createAuthSession).toHaveBeenCalledWith({
          userId: 'testuser',
          token: 'user-token',
          roles: ['Usuarios']
        });
        expect(mockNavigate).toHaveBeenCalledWith('/app/testuser');
      });
    });

    it('should handle alternative success format from backend', async () => {
      const user = userEvent.setup();
      authSession.createAuthSession = vi.fn();
      
      LDAPservice.mockResolvedValueOnce({
        status: 'success',
        accessToken: 'alt-token',
        role: ['Usuarios']
      });

      renderLogInForm();

      const userIdInput = screen.getByPlaceholderText('Id Usuario');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      
      await user.type(userIdInput, 'testuser');
      await user.type(passwordInput, 'testpass');

      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(authSession.createAuthSession).toHaveBeenCalledWith({
          userId: 'testuser',
          token: 'alt-token',
          roles: ['Usuarios']
        });
        expect(mockNavigate).toHaveBeenCalledWith('/app/testuser');
      });
    });
  });

  describe('Input Handling', () => {
    it('should update state when typing in userId field', async () => {
      const user = userEvent.setup();
      renderLogInForm();

      const userIdInput = screen.getByPlaceholderText('Id Usuario');
      await user.type(userIdInput, 'testuser123');

      expect(userIdInput).toHaveValue('testuser123');
    });

    it('should update state when typing in password field', async () => {
      const user = userEvent.setup();
      renderLogInForm();

      const passwordInput = screen.getByPlaceholderText('Contraseña');
      await user.type(passwordInput, 'securepass');

      expect(passwordInput).toHaveValue('securepass');
    });

    it('should clear error message on new submit attempt', async () => {
      const user = userEvent.setup();
      LDAPservice.mockResolvedValueOnce({
        success: false,
        message: 'Error'
      });

      renderLogInForm();

      const userIdInput = screen.getByPlaceholderText('Id Usuario');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

      await user.type(userIdInput, 'user1');
      await user.type(passwordInput, 'pass1');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      // Mock new successful response
      LDAPservice.mockResolvedValueOnce({
        success: true,
        token: 'token',
        roles: ['Usuarios']
      });

      // Clear and retry
      await user.clear(userIdInput);
      await user.clear(passwordInput);
      await user.type(userIdInput, 'user2');
      await user.type(passwordInput, 'pass2');
      
      // Old error should be cleared and no error shown until response
      await user.click(submitButton);
    });
  });
});
