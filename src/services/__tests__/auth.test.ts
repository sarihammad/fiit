import { AuthService } from '../auth';
import * as SecureStore from 'expo-secure-store';
import { http } from '../http';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('../http');
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    isSignedIn: jest.fn(),
    getCurrentUser: jest.fn(),
    signOut: jest.fn(),
  },
}));
jest.mock('expo-apple-authentication', () => ({
  isAvailable: true,
  signInAsync: jest.fn(),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockHttp = http as jest.Mocked<typeof http>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGuest', () => {
    it('should create a guest account successfully', async () => {
      const mockResponse = {
        user: { id: 'guest-123', email: 'guest@fiit.app', name: 'Guest User' },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        },
      };

      mockHttp.post.mockResolvedValue(mockResponse);
      mockSecureStore.setItemAsync.mockResolvedValue();

      const result = await AuthService.createGuest();

      expect(result).toEqual({
        user: mockResponse.user,
        tokens: mockResponse.tokens,
        isNewUser: true,
        success: true,
      });

      expect(mockHttp.post).toHaveBeenCalledWith('/auth/anonymous');
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledTimes(3);
    });

    it('should handle guest account creation failure', async () => {
      const error = new Error('Network error');
      mockHttp.post.mockRejectedValue(error);

      const result = await AuthService.createGuest();

      expect(result).toEqual({
        user: {} as any,
        tokens: {} as any,
        success: false,
        error: 'Network error',
      });
    });
  });

  describe('signOutServerSide', () => {
    it('should sign out from server and clear local data', async () => {
      mockHttp.post.mockResolvedValue({});
      mockSecureStore.removeItemAsync.mockResolvedValue();

      await AuthService.signOutServerSide();

      expect(mockHttp.post).toHaveBeenCalledWith('/auth/signout');
      expect(mockSecureStore.removeItemAsync).toHaveBeenCalledTimes(3);
    });

    it('should clear local data even if server call fails', async () => {
      const error = new Error('Server error');
      mockHttp.post.mockRejectedValue(error);
      mockSecureStore.removeItemAsync.mockResolvedValue();

      await AuthService.signOutServerSide();

      expect(mockHttp.post).toHaveBeenCalledWith('/auth/signout');
      expect(mockSecureStore.removeItemAsync).toHaveBeenCalledTimes(3);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('valid-token');

      const result = await AuthService.isAuthenticated();

      expect(result).toBe(true);
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('should return false when no token exists', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const result = await AuthService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user when stored', async () => {
      const mockUser = { id: '123', email: 'test@fiit.app', name: 'Test User' };
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockUser));

      const result = await AuthService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when no user stored', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const result = await AuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
