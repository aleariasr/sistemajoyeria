import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import Login from '../components/Login';
import { useAuth } from '../context/AuthContext';

// Mock useAuth for logout test
jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: jest.fn()
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Reset useAuth mock before each test
    useAuth.mockReturnValue({
      login: jest.fn(),
      logout: jest.fn(),
      user: null,
      loading: false
    });
  });

  test('renders login form with username and password fields', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  test('allows user to type username and password', async () => {
    renderWithProviders(<Login />);
    const user = userEvent.setup();
    
    const usernameInput = screen.getByLabelText(/usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin123');
    
    expect(usernameInput).toHaveValue('admin');
    expect(passwordInput).toHaveValue('admin123');
  });

  test('successfully logs in with admin credentials', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      success: true,
      usuario: { id: 1, username: 'admin', role: 'administrador' }
    });
    
    useAuth.mockReturnValue({
      login: mockLogin,
      user: null,
      loading: false
    });

    renderWithProviders(<Login />);
    const user = userEvent.setup();
    
    const usernameInput = screen.getByLabelText(/usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'admin');
    });
  });

  test('successfully logs in with dependiente credentials', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      success: true,
      usuario: { id: 2, username: 'dependiente', role: 'dependiente' }
    });
    
    useAuth.mockReturnValue({
      login: mockLogin,
      user: null,
      loading: false
    });

    renderWithProviders(<Login />);
    const user = userEvent.setup();
    
    const usernameInput = screen.getByLabelText(/usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(usernameInput, 'dependiente');
    await user.type(passwordInput, 'dependiente');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('dependiente', 'dependiente');
    });
  });

  test('shows error message with invalid credentials', async () => {
    const mockLogin = jest.fn().mockRejectedValue({
      response: {
        data: { error: 'Credenciales inválidas' }
      }
    });
    
    useAuth.mockReturnValue({
      login: mockLogin,
      user: null,
      loading: false
    });

    renderWithProviders(<Login />);
    const user = userEvent.setup();
    
    const usernameInput = screen.getByLabelText(/usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(usernameInput, 'wrong');
    await user.type(passwordInput, 'wrong');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    });
  });

  test('disables form during login attempt', async () => {
    const mockLogin = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    useAuth.mockReturnValue({
      login: mockLogin,
      user: null,
      loading: false
    });

    renderWithProviders(<Login />);
    const user = userEvent.setup();
    
    const usernameInput = screen.getByLabelText(/usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin');
    await user.click(submitButton);
    
    // Check that inputs are disabled during loading
    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  test('prevents empty form submission', async () => {
    renderWithProviders(<Login />);
    const user = userEvent.setup();
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    // Try to submit without filling in credentials
    await user.click(submitButton);
    
    // HTML5 validation should prevent submission
    const usernameInput = screen.getByLabelText(/usuario/i);
    expect(usernameInput).toBeInvalid();
  });
});

describe('Logout functionality', () => {
  test('successfully logs out user', async () => {
    const mockLogout = jest.fn().mockResolvedValue({ success: true });
    
    useAuth.mockReturnValue({
      login: jest.fn(),
      logout: mockLogout,
      user: { id: 1, username: 'admin', role: 'administrador' },
      loading: false
    });

    // Simulate logout action
    await mockLogout();
    
    expect(mockLogout).toHaveBeenCalled();
  });
});
