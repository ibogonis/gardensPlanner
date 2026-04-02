import "@testing-library/jest-dom";
import { useGardenStore } from "./features/planner/store/useGardenStore";

// Mock react-konva for testing (canvas not available in jest)
jest.mock("react-konva", () => {
  const React = require("react");
  return {
    Stage: React.forwardRef(({ children }, ref) => (
      <div ref={ref} data-testid="konva-stage">
        {children}
      </div>
    )),
    Layer: ({ children }) => <div data-testid="konva-layer">{children}</div>,
    Rect: () => <div data-testid="konva-rect" />,
    Circle: () => <div data-testid="konva-circle" />,
    Text: () => <div data-testid="konva-text" />,
    Transformer: () => <div data-testid="konva-transformer" />,
  };
});
jest.mock("axios", () => {
  const mockAxiosInstance = {
    get: jest.fn(() => Promise.resolve({ data: null })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
      get: mockAxiosInstance.get,
      post: mockAxiosInstance.post,
      put: mockAxiosInstance.put,
      delete: mockAxiosInstance.delete,
    },
  };
});

jest.mock("./app/providers/AuthProvider", () => {
  const React = require("react");

  const mockContext = {
    user: null,
    loading: false,
  };

  return {
    __esModule: true,
    AuthProvider: ({ children }) => children,
    AuthContext: React.createContext(mockContext),
  };
});

jest.mock("./app/providers/AuthGuard", () => ({
  AuthGuard: ({ children }) => children,
}));

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Zustand hydration mock

beforeEach(() => {
  // hydration resolves instantly in tests
  useGardenStore.persist.rehydrate = jest.fn(() => Promise.resolve());
});
