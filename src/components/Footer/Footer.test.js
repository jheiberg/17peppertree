import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from './Footer';

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

// Mock document.getElementById
const mockGetElementById = jest.fn();
Object.defineProperty(document, 'getElementById', {
  writable: true,
  value: mockGetElementById,
});

describe('Footer Component', () => {
  beforeEach(() => {
    mockScrollIntoView.mockClear();
    mockGetElementById.mockClear();
  });

  describe('Component Rendering', () => {
    test('renders footer with correct content', () => {
      render(<Footer />);
      
      // Check main heading
      expect(screen.getByText('17 @ Peppertree')).toBeInTheDocument();
      expect(screen.getByText('Premium self-catering accommodation in the heart of Brackenfell')).toBeInTheDocument();
      
      // Check contact section
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Phone: 063 630 7345')).toBeInTheDocument();
      expect(screen.getByText(/17 Peperboom Crescent/)).toBeInTheDocument();
      expect(screen.getByText(/Vredekloof, Brackenfell, 7560/)).toBeInTheDocument();
      
      // Check quick links section
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      
      // Check footer bottom
      expect(screen.getByText('© 2024 17 @ Peppertree. All rights reserved.')).toBeInTheDocument();
    });

    test('renders navigation buttons', () => {
      render(<Footer />);
      
      // Check that navigation buttons exist
      expect(screen.getByRole('button', { name: 'Accommodation' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Amenities' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Location' })).toBeInTheDocument();
    });

    test('has correct footer structure', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('bg-dark-brown', 'text-cream', 'py-12');

      // Check container structure
      const container = footer.querySelector('.container-custom');
      expect(container).toBeInTheDocument();

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();

      const borderSection = container.querySelector('.border-t');
      expect(borderSection).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    test('scrollToSection function works when element exists (lines 6-8)', () => {
      const mockElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockElement);
      
      render(<Footer />);
      
      // Click on Accommodation button (triggers lines 28, and through onClick, lines 5-8)
      const accommodationButton = screen.getByRole('button', { name: 'Accommodation' });
      fireEvent.click(accommodationButton);
      
      // Verify getElementById was called with correct ID
      expect(mockGetElementById).toHaveBeenCalledWith('accommodation');
      
      // Verify scrollIntoView was called with correct options
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    test('scrollToSection handles element not found (line 7 conditional)', () => {
      // Mock getElementById to return null (element not found)
      mockGetElementById.mockReturnValue(null);
      
      render(<Footer />);
      
      // Click on Amenities button
      const amenitiesButton = screen.getByRole('button', { name: 'Amenities' });
      fireEvent.click(amenitiesButton);
      
      // Verify getElementById was called but scrollIntoView was not
      expect(mockGetElementById).toHaveBeenCalledWith('amenities');
      expect(mockScrollIntoView).not.toHaveBeenCalled();
    });

    test('all navigation buttons trigger scrollToSection (lines 28-30)', () => {
      const mockElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockElement);
      
      render(<Footer />);
      
      // Test Accommodation button (line 28)
      const accommodationButton = screen.getByRole('button', { name: 'Accommodation' });
      fireEvent.click(accommodationButton);
      expect(mockGetElementById).toHaveBeenCalledWith('accommodation');
      
      // Test Amenities button (line 29)  
      const amenitiesButton = screen.getByRole('button', { name: 'Amenities' });
      fireEvent.click(amenitiesButton);
      expect(mockGetElementById).toHaveBeenCalledWith('amenities');
      
      // Test Location button (line 30)
      const locationButton = screen.getByRole('button', { name: 'Location' });
      fireEvent.click(locationButton);
      expect(mockGetElementById).toHaveBeenCalledWith('location');
      
      // Verify scrollIntoView was called for each valid click
      expect(mockScrollIntoView).toHaveBeenCalledTimes(3);
    });

    test('navigation buttons have correct section IDs', () => {
      const mockElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockElement);
      
      render(<Footer />);
      
      // Test each button maps to correct section ID
      const testCases = [
        { buttonName: 'Accommodation', expectedId: 'accommodation' },
        { buttonName: 'Amenities', expectedId: 'amenities' },
        { buttonName: 'Location', expectedId: 'location' }
      ];
      
      testCases.forEach(({ buttonName, expectedId }) => {
        mockGetElementById.mockClear();
        
        const button = screen.getByRole('button', { name: buttonName });
        fireEvent.click(button);
        
        expect(mockGetElementById).toHaveBeenCalledWith(expectedId);
      });
    });
  });

  describe('Accessibility', () => {
    test('footer has proper semantic structure', () => {
      render(<Footer />);
      
      // Footer should have contentinfo role
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      
      // Should have proper headings
      expect(screen.getByRole('heading', { level: 3, name: '17 @ Peppertree' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'Contact' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'Quick Links' })).toBeInTheDocument();
    });

    test('navigation buttons are accessible', () => {
      render(<Footer />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
      
      // Check specific button accessibility
      const accommodationButton = screen.getByRole('button', { name: 'Accommodation' });
      expect(accommodationButton).toHaveAccessibleName('Accommodation');
    });

    test('contact information is properly structured', () => {
      render(<Footer />);

      // Contact info should be properly structured with heading
      const contactHeading = screen.getByText('Contact');
      expect(contactHeading).toBeInTheDocument();
      expect(contactHeading.tagName).toBe('H4');

      // Check that contact info is present and readable
      expect(screen.getByText(/Phone: 063 630 7345/)).toBeInTheDocument();
      expect(screen.getByText(/17 Peperboom Crescent/)).toBeInTheDocument();
    });
  });

  describe('Content Accuracy', () => {
    test('displays correct business information', () => {
      render(<Footer />);
      
      // Business name
      expect(screen.getByText('17 @ Peppertree')).toBeInTheDocument();
      
      // Description
      expect(screen.getByText('Premium self-catering accommodation in the heart of Brackenfell')).toBeInTheDocument();
      
      // Phone number
      expect(screen.getByText('Phone: 063 630 7345')).toBeInTheDocument();
      
      // Address
      expect(screen.getByText(/17 Peperboom Crescent/)).toBeInTheDocument();
      expect(screen.getByText(/Vredekloof, Brackenfell, 7560/)).toBeInTheDocument();
      
      // Copyright
      expect(screen.getByText('© 2024 17 @ Peppertree. All rights reserved.')).toBeInTheDocument();
    });

    test('navigation links point to correct sections', () => {
      render(<Footer />);
      
      // Check that we have the expected navigation items
      const expectedLinks = ['Accommodation', 'Amenities', 'Location'];
      
      expectedLinks.forEach(linkText => {
        expect(screen.getByRole('button', { name: linkText })).toBeInTheDocument();
      });
    });
  });

  describe('CSS Classes', () => {
    test('applies correct CSS classes', () => {
      const { container } = render(<Footer />);

      // Check main footer class
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('bg-dark-brown', 'text-cream', 'py-12');

      // Check container class
      const containerDiv = footer.querySelector('.container-custom');
      expect(containerDiv).toBeInTheDocument();

      // Check footer content structure
      const gridContent = containerDiv.querySelector('.grid');
      expect(gridContent).toBeInTheDocument();

      // Check for 3 main sections (company info, contact, quick links)
      const sections = gridContent.children;
      expect(sections).toHaveLength(3);

      // Check footer bottom
      const footerBottom = containerDiv.querySelector('.border-t');
      expect(footerBottom).toBeInTheDocument();
      expect(footerBottom).toHaveClass('pt-4', 'text-center');
    });
  });
});