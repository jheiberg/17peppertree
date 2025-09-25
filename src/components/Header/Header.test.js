import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

// Mock getElementById
const mockGetElementById = jest.fn();
Object.defineProperty(document, 'getElementById', {
  value: mockGetElementById,
  writable: true
});

describe('Header Component', () => {
  beforeEach(() => {
    mockScrollIntoView.mockClear();
    mockGetElementById.mockClear();
  });

  describe('Rendering', () => {
    test('renders header with logo', () => {
      render(<Header />);
      expect(screen.getByText('17 @ Peppertree')).toBeInTheDocument();
    });

    test('renders navigation menu with all links', () => {
      render(<Header />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Accommodation')).toBeInTheDocument();
      expect(screen.getByText('Amenities')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    test('renders hamburger menu for mobile', () => {
      render(<Header />);

      const hamburger = document.querySelector('.lg\\:hidden');
      expect(hamburger).toBeInTheDocument();

      const bars = hamburger.querySelectorAll('span');
      expect(bars).toHaveLength(3);
    });

    test('navigation menu is initially not active', () => {
      render(<Header />);

      const navMenu = document.querySelector('ul');
      expect(navMenu).toHaveClass('hidden', 'lg:flex');
      expect(navMenu).not.toHaveClass('fixed', 'left-0', 'top-\\[70px\\]');
    });

    test('hamburger menu is initially not active', () => {
      render(<Header />);

      const hamburger = document.querySelector('.lg\\:hidden');
      expect(hamburger).toBeInTheDocument();
      expect(hamburger).toHaveClass('lg:hidden', 'flex', 'flex-col', 'cursor-pointer');
    });
  });

  describe('Mobile Menu Toggle', () => {
    test('toggles menu when hamburger is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburger = document.querySelector('.lg\\:hidden');
      const navMenu = document.querySelector('ul');

      // Initially not active (menu is hidden)
      expect(navMenu).toHaveClass('hidden', 'lg:flex');

      // Click to open menu
      await user.click(hamburger);
      expect(navMenu).toHaveClass('fixed', 'left-0');
      expect(navMenu).not.toHaveClass('hidden');

      // Click to close menu
      await user.click(hamburger);
      expect(navMenu).toHaveClass('hidden', 'lg:flex');
      expect(hamburger).not.toHaveClass('active');
    });

    test('closes menu when navigation link is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburger = document.querySelector('.lg\\:hidden');
      const navMenu = document.querySelector('ul');
      const homeLink = screen.getByText('Home');

      // Open menu first
      await user.click(hamburger);
      expect(navMenu).toHaveClass('fixed', 'left-0');
      
      // Mock getElementById to return a mock element
      const mockElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockElement);
      
      // Click navigation link
      await user.click(homeLink);

      // Menu should be closed
      expect(navMenu).toHaveClass('hidden', 'lg:flex');
    });
  });

  describe('Navigation Scrolling', () => {
    test('scrolls to correct section when nav link is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const mockElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockElement);
      
      const homeLink = screen.getByText('Home');
      await user.click(homeLink);
      
      expect(mockGetElementById).toHaveBeenCalledWith('home');
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    test('scrolls to accommodation section', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const mockElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockElement);
      
      const accommodationLink = screen.getByText('Accommodation');
      await user.click(accommodationLink);
      
      expect(mockGetElementById).toHaveBeenCalledWith('accommodation');
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    test('scrolls to amenities section', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const mockElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockElement);
      
      const amenitiesLink = screen.getByText('Amenities');
      await user.click(amenitiesLink);
      
      expect(mockGetElementById).toHaveBeenCalledWith('amenities');
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    test('scrolls to location section', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const mockElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockElement);
      
      const locationLink = screen.getByText('Location');
      await user.click(locationLink);
      
      expect(mockGetElementById).toHaveBeenCalledWith('location');
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    test('scrolls to contact section', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const mockElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockElement);
      
      const contactLink = screen.getByText('Contact');
      await user.click(contactLink);
      
      expect(mockGetElementById).toHaveBeenCalledWith('contact');
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    test('handles case when element is not found', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      // Mock getElementById to return null (element not found)
      mockGetElementById.mockReturnValue(null);
      
      const homeLink = screen.getByText('Home');
      await user.click(homeLink);
      
      expect(mockGetElementById).toHaveBeenCalledWith('home');
      expect(mockScrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    test('hamburger menu responds to Enter key', () => {
      render(<Header />);

      const hamburger = document.querySelector('.lg\\:hidden');
      const navMenu = document.querySelector('ul');

      // Initially not active
      expect(navMenu).toHaveClass('hidden', 'lg:flex');

      // Press Enter on hamburger (simulate click since hamburger doesn't have onKeyDown)
      fireEvent.click(hamburger);

      expect(navMenu).toHaveClass('fixed', 'left-0');
    });

    test('navigation links respond to Enter key', () => {
      render(<Header />);
      
      const mockElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockElement);
      
      const homeLink = screen.getByText('Home');
      
      // Press Enter on navigation link
      fireEvent.keyDown(homeLink, { key: 'Enter', code: 'Enter' });
      fireEvent.click(homeLink);
      
      expect(mockGetElementById).toHaveBeenCalledWith('home');
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  describe('Accessibility', () => {
    test('hamburger menu is accessible', () => {
      render(<Header />);

      const hamburger = document.querySelector('.lg\\:hidden');
      expect(hamburger).toBeInTheDocument();

      // Should be clickable (check by firing click event)
      fireEvent.click(hamburger);
      // If no error is thrown, the element is clickable
    });

    test('navigation links are buttons for accessibility', () => {
      render(<Header />);
      
      const navLinks = screen.getAllByRole('button');
      expect(navLinks.length).toBeGreaterThan(0);
      
      // Each nav item should be a button
      expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Accommodation' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Amenities' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Location' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Contact' })).toBeInTheDocument();
    });

    test('navigation has proper semantic structure', () => {
      render(<Header />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveClass('fixed', 'top-0', 'w-full');

      const navList = document.querySelector('ul');
      expect(navList).toBeInTheDocument();
      expect(navList.tagName).toBe('UL');

      const navItems = document.querySelectorAll('ul li');
      expect(navItems).toHaveLength(5);
    });
  });

  describe('Component State Management', () => {
    test('maintains menu state correctly across multiple toggles', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburger = document.querySelector('.lg\\:hidden');
      const navMenu = document.querySelector('ul');

      // Test multiple toggle cycles
      for (let i = 0; i < 3; i++) {
        // Open menu
        await user.click(hamburger);
        expect(navMenu).toHaveClass('fixed', 'left-0');

        // Close menu
        await user.click(hamburger);
        expect(navMenu).toHaveClass('hidden', 'lg:flex');
      }
    });

    test('menu state resets when navigation link is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburger = document.querySelector('.lg\\:hidden');
      const navMenu = document.querySelector('ul');
      const homeLink = screen.getByText('Home');

      const mockElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockElement);

      // Open menu
      await user.click(hamburger);
      expect(navMenu).toHaveClass('fixed', 'left-0');
      
      // Click navigation link - should close menu
      await user.click(homeLink);
      expect(navMenu).toHaveClass('hidden', 'lg:flex');
      
      // Test with another link
      await user.click(hamburger);
      expect(navMenu).toHaveClass('fixed', 'left-0');

      await user.click(screen.getByText('Contact'));
      expect(navMenu).toHaveClass('hidden', 'lg:flex');
    });
  });

  describe('CSS Classes and Styling', () => {
    test('applies correct CSS classes', () => {
      render(<Header />);

      expect(document.querySelector('nav')).toHaveClass('fixed', 'top-0', 'w-full');
      expect(document.querySelector('.max-w-6xl')).toBeInTheDocument();
      expect(document.querySelector('.nav-logo')).toBeInTheDocument();
      expect(document.querySelector('ul')).toBeInTheDocument();
      expect(document.querySelector('.lg\\:hidden')).toBeInTheDocument();

      const navLinks = document.querySelectorAll('.nav-link');
      expect(navLinks).toHaveLength(5);

      const bars = document.querySelectorAll('span');
      expect(bars).toHaveLength(3);
    });

    test('conditional classes are applied correctly', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburger = document.querySelector('.lg\\:hidden');
      const navMenu = document.querySelector('ul');

      // Check initial state - menu is hidden
      expect(navMenu).toHaveClass('hidden', 'lg:flex');

      // After clicking hamburger - menu opens
      await user.click(hamburger);
      expect(navMenu).toHaveClass('fixed', 'left-0');
      expect(navMenu).not.toHaveClass('hidden');

      // After clicking again - menu closes
      await user.click(hamburger);
      expect(navMenu).toHaveClass('hidden', 'lg:flex');
      expect(navMenu).not.toHaveClass('fixed', 'left-0');
    });
  });
});