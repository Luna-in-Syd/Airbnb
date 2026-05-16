import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
import { vi } from 'vitest';

// Create theme for tests (same as in App.jsx)
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

/**
 * Custom render function that wraps components with all necessary providers
 * @param {ReactElement} ui - Component to render
 * @param {Object} options - Additional options
 * @param {Object} options.authValue - Custom auth context value
 * @param {string} options.initialRoute - Initial route for MemoryRouter
 * @returns {RenderResult}
 */
export function renderWithProviders(ui, options = {}) {
  const {
    authValue = {
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    },
    ...renderOptions
  } = options;

  function Wrapper({ children }) {
    return (
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={authValue}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </AuthContext.Provider>
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Create mock auth context with custom values
 */
export function createMockAuthContext(overrides = {}) {
  return {
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    ...overrides,
  };
}

/**
 * Mock authenticated user
 */
export const mockAuthenticatedUser = {
  email: 'test@example.com',
  token: 'mock-token-123',
};

/**
 * Mock listing data
 */
export const mockListing = {
  id: 1,
  title: 'Cozy Beach House',
  owner: 'host@example.com',
  address: {
    street: '123 Ocean Ave',
    city: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    country: 'Australia',
  },
  price: 150,
  thumbnail: 'https://example.com/image.jpg',
  metadata: {
    propertyType: 'House',
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning'],
    images: ['image1.jpg', 'image2.jpg'],
  },
  reviews: [
    {
      rating: 5,
      comment: 'Great place!',
      author: 'guest@example.com',
    },
  ],
  availability: [],
  published: true,
  postedOn: '2024-01-01T00:00:00.000Z',
};

/**
 * Mock listings array
 */
export const mockListings = [
  mockListing,
  {
    ...mockListing,
    id: 2,
    title: 'Modern City Apartment',
    price: 200,
  },
  {
    ...mockListing,
    id: 3,
    title: 'Rustic Mountain Cabin',
    price: 120,
  },
];

/**
 * Mock booking data
 */
export const mockBooking = {
  id: 1,
  owner: 'host@example.com',
  dateRange: {
    start: '2024-12-20',
    end: '2024-12-27',
  },
  totalPrice: 1050,
  listingId: '1',
  status: 'pending',
};
 /* Setup fetch mock for successful response*/
export function mockFetchSuccess(data) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  });
}
/* Setup fetch mock for error response*/
export function mockFetchError(error = 'API Error', status = 500) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ error }),
  });
}
 /* Setup fetch mock for network failure*/
export function mockFetchFailure(message = 'Network error') {
  global.fetch = vi.fn().mockRejectedValue(new Error(message));
}
 /* Wait for loading to complete*/
export async function waitForLoadingToFinish() {
  const { waitFor, screen } = await import('@testing-library/react');
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
}
 /* Helper to fill out a form*/
export async function fillFormField(user, labelText, value) {
  const { screen } = await import('@testing-library/react');
  const input = screen.getByLabelText(new RegExp(labelText, 'i'));
  await user.clear(input);
  await user.type(input, value);
  return input;
}
 /* Mock localStorage*/
export function mockLocalStorage() {
  const storage = {};
  return {
    getItem: vi.fn((key) => storage[key] || null),
    setItem: vi.fn((key, value) => {
      storage[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
  };
}
 /* Setup localStorage mock*/
export function setupLocalStorageMock() {
  const localStorageMock = mockLocalStorage();
  global.localStorage = localStorageMock;
  return localStorageMock;
}
export * from '@testing-library/react';