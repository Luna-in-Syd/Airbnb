import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from "vitest";
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Header from "../../components/layout/Header";
import { AuthContext } from '../../context/AuthContext';

// Create theme (same as App.jsx)
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Helper to render with router and context
const renderWithContext = (component, authValue = null) => {
  const defaultAuthValue = {
    user: authValue,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn()
  };

  return render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider value={defaultAuthValue}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

describe("Header Component", () => {
  it("renders the app title", () => {
    renderWithContext(<Header />);
    expect(screen.getByText('AirBrB')).toBeInTheDocument();
  });

  it("shows login and register buttons when not authenticated", () => {
    renderWithContext(<Header />);
    
    expect(screen.getByLabelText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Register')).toBeInTheDocument();
  });

  it("renders all navigation elements", () => {
    renderWithContext(<Header />);
    
    // Check that header exists
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });
});

describe("Header Navigation", () => {
  it("has clickable login button", () => {
    renderWithContext(<Header />);
    
    const loginButton = screen.getByLabelText('Login');
    expect(loginButton).toBeEnabled();
  });

  it("has clickable register button", () => {
    renderWithContext(<Header />);
    
    const registerButton = screen.getByLabelText('Register');
    expect(registerButton).toBeEnabled();
  });
});