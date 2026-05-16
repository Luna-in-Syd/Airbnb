import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from "vitest";
import App from "../App";

// Mock the API calls to prevent ECONNREFUSED errors
global.fetch = vi.fn();

describe("App Component Tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock successful API response for listings
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ listings: [] })
    });
  });

  it("renders the application header", () => {
    render(<App />);
    expect(screen.getByText('AirBrB')).toBeInTheDocument();
  });

  it("renders login button in header", () => {
    render(<App />);
    expect(screen.getByLabelText('Login')).toBeInTheDocument();
  });

  it("renders register button in header", () => {
    render(<App />);
    expect(screen.getByLabelText('Register')).toBeInTheDocument();
  });

  it("shows loading spinner initially", () => {
    render(<App />);
    // The CircularProgress has role="progressbar"
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});

describe("Navigation Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ listings: [] })
    });
  });

  it("renders header navigation buttons", () => {
    render(<App />);
    
    const loginButton = screen.getByLabelText('Login');
    const registerButton = screen.getByLabelText('Register');
    
    expect(loginButton).toBeInTheDocument();
    expect(registerButton).toBeInTheDocument();
  });
});

describe("API Integration Tests", () => {
  it("calls API to fetch listings on mount", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        listings: [
          { id: 1, title: "Test Listing", published: true }
        ] 
      })
    });

    render(<App />);

    // Wait for the API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it("handles API errors gracefully", async () => {
    // Mock API failure
    fetch.mockRejectedValue(new Error('API Error'));

    render(<App />);

    // App should still render even if API fails
    expect(screen.getByText('AirBrB')).toBeInTheDocument();
  });
});