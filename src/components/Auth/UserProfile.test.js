/**
 * Comprehensive tests for UserProfile component
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from './UserProfile';
import { useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext');
const mockUseAuth = useAuth;

describe('UserProfile Component', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to click the profile button and open dropdown
  const openDropdown = async (user, userName = 'John Doe') => {
    let profileButton;

    try {
      // Try to find by name first
      profileButton = screen.getAllByText(userName)[0].closest('button');
    } catch {
      try {
        // Fallback to first button (should be the profile button)
        profileButton = screen.getAllByRole('button')[0];
      } catch {
        throw new Error('Could not find profile button');
      }
    }

    await act(async () => {
      await user.click(profileButton);
    });
    return profileButton;
  };

  const defaultUser = {
    given_name: 'John',
    name: 'John Doe',
    preferred_username: 'johndoe',
    email: 'john.doe@example.com',
    email_verified: true,
    realm_access: {
      roles: ['user', 'admin']
    }
  };

  const defaultAuthContext = {
    user: defaultUser,
    logout: mockLogout,
    isAuthenticated: true,
    loading: false,
    login: jest.fn(),
    getAccessToken: jest.fn(),
    isAdmin: jest.fn(),
    initialized: true,
    handleCallback: jest.fn()
  };

  describe('Component Visibility', () => {
    test('renders when user is authenticated and has user data', () => {
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      expect(screen.getByText('J')).toBeInTheDocument(); // Avatar initial
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    test('returns null when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isAuthenticated: false
      });

      const { container } = render(<UserProfile />);

      expect(container.firstChild).toBeNull();
    });

    test('returns null when user is null', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: null
      });

      const { container } = render(<UserProfile />);

      expect(container.firstChild).toBeNull();
    });

    test('returns null when user is undefined', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: undefined
      });

      const { container } = render(<UserProfile />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('User Avatar and Basic Info', () => {
    test('displays correct avatar initial from given_name', () => {
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      const avatar = screen.getByText('J');
      expect(avatar).toBeInTheDocument();
      expect(avatar.closest('div')).toHaveClass('w-8', 'h-8', 'bg-blue-500', 'rounded-full');
    });

    test('falls back to preferred_username initial when no given_name', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          ...defaultUser,
          given_name: undefined,
          preferred_username: 'testuser'
        }
      });

      render(<UserProfile />);

      expect(screen.getByText('t')).toBeInTheDocument();
    });

    test('displays default "U" when no initials available', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          ...defaultUser,
          given_name: undefined,
          preferred_username: undefined
        }
      });

      render(<UserProfile />);

      expect(screen.getByText('U')).toBeInTheDocument();
    });

    test('handles empty given_name gracefully', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          ...defaultUser,
          given_name: '',
          preferred_username: 'testuser'
        }
      });

      render(<UserProfile />);

      expect(screen.getByText('t')).toBeInTheDocument();
    });

    test('displays user name from name field', () => {
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('falls back to preferred_username when no name', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          ...defaultUser,
          name: undefined
        }
      });

      render(<UserProfile />);

      expect(screen.getByText('johndoe')).toBeInTheDocument();
    });

    test('displays email address', () => {
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('has correct responsive classes', () => {
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      const userInfoDiv = screen.getByText('John Doe').closest('div');
      expect(userInfoDiv).toHaveClass('hidden', 'md:block');
    });

    test('profile button has correct styling', () => {
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('flex', 'items-center', 'space-x-3', 'p-2', 'rounded-lg', 'hover:bg-gray-100');
    });
  });

  describe('Dropdown Functionality', () => {
    test('toggles dropdown when profile button is clicked', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      // Initially dropdown should be hidden
      expect(screen.queryByText('Username:')).not.toBeInTheDocument();

      // Click to show dropdown - use more specific selector
      const profileButton = screen.getByText('John Doe').closest('button');
      await act(async () => {
        await user.click(profileButton);
      });

      expect(screen.getByText('Username:')).toBeInTheDocument();
      expect(screen.getByText('Email Verified:')).toBeInTheDocument();

      // Click again to hide dropdown
      await act(async () => {
        await user.click(profileButton);
      });

      expect(screen.queryByText('Username:')).not.toBeInTheDocument();
    });

    test('dropdown has correct styling and structure', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      await openDropdown(user);

      const dropdown = screen.getByText('Username:').closest('.absolute');
      expect(dropdown).toHaveClass('right-0', 'mt-2', 'w-80', 'bg-white', 'rounded-lg', 'shadow-lg', 'border', 'z-50');
    });

    test('displays larger avatar in dropdown', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      await openDropdown(user);

      // Should have both small avatar (in button) and large avatar (in dropdown)
      const avatars = screen.getAllByText('J');
      expect(avatars).toHaveLength(2);

      // Check for the larger avatar in dropdown
      const largeAvatar = avatars.find(avatar =>
        avatar.closest('div')?.classList.contains('w-12')
      );
      expect(largeAvatar).toBeDefined();
      expect(largeAvatar?.closest('div')).toHaveClass('w-12', 'h-12', 'text-lg');
    });
  });

  describe('User Information Display', () => {
    test('displays username in dropdown', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      await openDropdown(user);

      expect(screen.getByText('Username:')).toBeInTheDocument();
      expect(screen.getByText('johndoe')).toBeInTheDocument();
    });

    test('displays email verification status - verified', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      await openDropdown(user);

      expect(screen.getByText('Email Verified:')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    test('displays email verification status - not verified', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          ...defaultUser,
          email_verified: false
        }
      });

      render(<UserProfile />);

      await openDropdown(user);

      expect(screen.getByText('Email Verified:')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    test('handles undefined email_verified', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          ...defaultUser,
          email_verified: undefined
        }
      });

      render(<UserProfile />);

      await openDropdown(user);

      expect(screen.getByText('No')).toBeInTheDocument();
    });

    test('displays user header information in dropdown', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      await openDropdown(user);

      // Check header section
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('John Doe');

      // Should show email in both the main button area and the dropdown header
      const emailElements = screen.getAllByText('john.doe@example.com');
      expect(emailElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Roles Display', () => {
    test('displays user roles when available', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      await openDropdown(user);

      expect(screen.getByText('Roles:')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();

      // Check role styling
      const roleElements = screen.getAllByText(/^(user|admin)$/);
      roleElements.forEach(element => {
        expect(element).toHaveClass('px-2', 'py-1', 'bg-blue-100', 'text-blue-800', 'text-xs', 'rounded');
      });
    });

    test('displays single role correctly', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          ...defaultUser,
          realm_access: {
            roles: ['user']
          }
        }
      });

      render(<UserProfile />);

      await openDropdown(user);

      expect(screen.getByText('Roles:')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
    });

    test('does not display roles section when no realm_access', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          ...defaultUser,
          realm_access: undefined
        }
      });

      render(<UserProfile />);

      await openDropdown(user);

      expect(screen.queryByText('Roles:')).not.toBeInTheDocument();
    });

    test('does not display roles section when no roles array', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          ...defaultUser,
          realm_access: {}
        }
      });

      render(<UserProfile />);

      await openDropdown(user);

      expect(screen.queryByText('Roles:')).not.toBeInTheDocument();
    });

    test('does not display roles section when roles array is empty', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          ...defaultUser,
          realm_access: {
            roles: []
          }
        }
      });

      render(<UserProfile />);

      await openDropdown(user);

      expect(screen.queryByText('Roles:')).not.toBeInTheDocument();
    });

    test('handles many roles with proper wrapping', async () => {
      const user = userEvent.setup();
      const manyRoles = ['user', 'admin', 'manager', 'editor', 'viewer', 'moderator'];

      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          ...defaultUser,
          realm_access: {
            roles: manyRoles
          }
        }
      });

      render(<UserProfile />);

      await openDropdown(user);

      expect(screen.getByText('Roles:')).toBeInTheDocument();

      manyRoles.forEach(role => {
        expect(screen.getByText(role)).toBeInTheDocument();
      });

      // Check that roles container has flex-wrap
      const rolesContainer = screen.getByText('user').closest('.flex-wrap');
      expect(rolesContainer).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    test('calls logout when Sign Out button is clicked', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      await openDropdown(user);

      const signOutButton = screen.getByText('Sign Out');
      expect(signOutButton).toBeInTheDocument();

      await act(async () => {
        await user.click(signOutButton);
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    test('Sign Out button has correct styling', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      await openDropdown(user);

      const signOutButton = screen.getByText('Sign Out');
      expect(signOutButton).toHaveClass('w-full', 'px-4', 'py-2', 'bg-red-600', 'text-white', 'rounded', 'hover:bg-red-700');
    });

    test('Sign Out button is in correct container', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      await openDropdown(user);

      const signOutButton = screen.getByText('Sign Out');
      const buttonContainer = signOutButton.closest('.border-t');
      expect(buttonContainer).toHaveClass('p-4', 'border-t', 'border-gray-200');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles missing user properties gracefully', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          // Minimal user object
          email: 'test@example.com'
        }
      });

      render(<UserProfile />);

      // Should still render with default values
      expect(screen.getByText('U')).toBeInTheDocument(); // Default avatar

      await openDropdown(user, 'test@example.com');

      expect(screen.getByText('Username:')).toBeInTheDocument();
      expect(screen.getByText('Email Verified:')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument(); // Default email_verified
    });

    test('handles user with only email', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          email: 'minimal@example.com'
        }
      });

      render(<UserProfile />);

      expect(screen.getByText('U')).toBeInTheDocument();
      expect(screen.getByText('minimal@example.com')).toBeInTheDocument();
    });

    test('dropdown positioning and z-index', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      await openDropdown(user);

      const dropdown = screen.getByText('Sign Out').closest('.absolute');
      expect(dropdown).toHaveClass('absolute', 'right-0', 'z-50');
    });

    test('handles long usernames and emails', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        user: {
          ...defaultUser,
          preferred_username: 'very_long_username_that_might_break_layout',
          email: 'very.long.email.address.that.might.cause.issues@example-domain.com',
          name: 'Very Long Full Name That Might Overflow'
        }
      });

      render(<UserProfile />);

      expect(screen.getByText('Very Long Full Name That Might Overflow')).toBeInTheDocument();

      await openDropdown(user, 'Very Long Full Name That Might Overflow');

      expect(screen.getByText('very_long_username_that_might_break_layout')).toBeInTheDocument();
      expect(screen.getAllByText('very.long.email.address.that.might.cause.issues@example-domain.com')).toHaveLength(2); // Should appear twice: in button and dropdown
    });
  });

  describe('Component State Management', () => {
    test('maintains dropdown state through multiple interactions', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      // Open dropdown
      await openDropdown(user);
      expect(screen.getByText('Sign Out')).toBeInTheDocument();

      // Interact with logout button (without actually clicking it)
      const signOutButton = screen.getByText('Sign Out');
      await user.hover(signOutButton);

      // Dropdown should still be open
      expect(screen.getByText('Sign Out')).toBeInTheDocument();

      // Close dropdown
      await openDropdown(user);
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });

    test('dropdown state resets on re-render', () => {
      mockUseAuth.mockReturnValue(defaultAuthContext);

      const { rerender } = render(<UserProfile />);

      // Component should start with dropdown closed
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();

      rerender(<UserProfile />);

      // Should still be closed after rerender
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    test('complete user interaction flow', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue(defaultAuthContext);

      render(<UserProfile />);

      // 1. Initial state - profile visible, dropdown hidden
      expect(screen.getByText('J')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();

      // 2. Click to open dropdown
      await openDropdown(user);

      // 3. Verify all dropdown content
      expect(screen.getByText('Username:')).toBeInTheDocument();
      expect(screen.getByText('johndoe')).toBeInTheDocument();
      expect(screen.getByText('Email Verified:')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('Roles:')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();

      // 4. Click logout
      await act(async () => {
        await user.click(screen.getByText('Sign Out'));
      });
      expect(mockLogout).toHaveBeenCalledTimes(1);

      // 5. Close dropdown by clicking profile again
      await openDropdown(user);
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });
  });
});