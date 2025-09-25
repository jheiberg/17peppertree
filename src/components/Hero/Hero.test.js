import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Hero from './Hero';

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

// Mock getElementById
const mockGetElementById = jest.fn();
Object.defineProperty(document, 'getElementById', {
  value: mockGetElementById,
  writable: true
});

describe('Hero Component', () => {
  beforeEach(() => {
    mockScrollIntoView.mockClear();
    mockGetElementById.mockClear();
  });

  describe('Rendering', () => {
    test('renders hero section with correct id', () => {
      render(<Hero />);
      const heroSection = document.querySelector('#home');
      expect(heroSection).toBeInTheDocument();
      expect(heroSection).toHaveClass('h-screen', 'bg-cover', 'bg-center');
    });

    test('renders hero title and subtitle', () => {
      render(<Hero />);
      
      expect(screen.getByText('17 @ Peppertree')).toBeInTheDocument();
      expect(screen.getByText('Premium Self Catering Guest Room in Vredekloof, Brackenfell')).toBeInTheDocument();
    });

    test('renders rating section with stars and text', () => {
      render(<Hero />);

      const stars = document.querySelectorAll('.fas.fa-star');
      expect(stars).toHaveLength(5);

      expect(screen.getByText('4.9/5 (68 reviews)')).toBeInTheDocument();
    });

    test('renders price information', () => {
      render(<Hero />);
      
      expect(screen.getByText('From R850')).toBeInTheDocument();
      expect(screen.getByText('per night')).toBeInTheDocument();
    });

    test('renders Book Now CTA button', () => {
      render(<Hero />);

      const ctaButton = screen.getByText('Book Now');
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveClass('btn-primary');
      expect(ctaButton.tagName).toBe('BUTTON');
    });

    test('renders hero overlay', () => {
      render(<Hero />);

      const overlay = document.querySelector('.bg-hero-gradient');
      expect(overlay).toBeInTheDocument();
    });

    test('renders scroll indicator', () => {
      render(<Hero />);

      const chevronIcon = document.querySelector('.fas.fa-chevron-down');
      expect(chevronIcon).toBeInTheDocument();
      expect(chevronIcon).toHaveClass('text-2xl', 'text-warm-white');

      // The animate-bounce-slow class is on the parent container
      const scrollContainer = document.querySelector('.animate-bounce-slow');
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  describe('Book Now Button Functionality', () => {
    test('scrolls to contact section when Book Now is clicked', async () => {
      const user = userEvent.setup();
      render(<Hero />);
      
      const mockContactElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockContactElement);
      
      const bookNowButton = screen.getByText('Book Now');
      await user.click(bookNowButton);
      
      expect(mockGetElementById).toHaveBeenCalledWith('contact');
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    test('handles case when contact element is not found', async () => {
      const user = userEvent.setup();
      render(<Hero />);
      
      // Mock getElementById to return null (element not found)
      mockGetElementById.mockReturnValue(null);
      
      const bookNowButton = screen.getByText('Book Now');
      await user.click(bookNowButton);
      
      expect(mockGetElementById).toHaveBeenCalledWith('contact');
      expect(mockScrollIntoView).not.toHaveBeenCalled();
    });

    test('Book Now button is clickable multiple times', async () => {
      const user = userEvent.setup();
      render(<Hero />);
      
      const mockContactElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValue(mockContactElement);
      
      const bookNowButton = screen.getByText('Book Now');
      
      // Click multiple times
      await user.click(bookNowButton);
      await user.click(bookNowButton);
      await user.click(bookNowButton);
      
      expect(mockGetElementById).toHaveBeenCalledTimes(3);
      expect(mockScrollIntoView).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic structure', () => {
      render(<Hero />);
      
      const heroSection = document.querySelector('section#home');
      expect(heroSection).toBeInTheDocument();
      
      const heroTitle = screen.getByRole('heading', { level: 1 });
      expect(heroTitle).toHaveTextContent('17 @ Peppertree');
    });

    test('Book Now button is accessible', () => {
      render(<Hero />);
      
      const bookNowButton = screen.getByRole('button', { name: 'Book Now' });
      expect(bookNowButton).toBeInTheDocument();
      expect(bookNowButton).not.toBeDisabled();
    });

    test('has appropriate heading hierarchy', () => {
      render(<Hero />);
      
      // Should have h1 for main title
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('17 @ Peppertree');
      
      // Subtitle should be a paragraph, not heading
      const subtitle = screen.getByText('Premium Self Catering Guest Room in Vredekloof, Brackenfell');
      expect(subtitle).toHaveClass('text-xl', 'text-cream');
      expect(subtitle.tagName).toBe('P');
    });
  });

  describe('CSS Classes and Structure', () => {
    test('applies correct Tailwind CSS classes', () => {
      render(<Hero />);

      const heroSection = document.querySelector('#home');
      expect(heroSection).toHaveClass('h-screen', 'bg-cover', 'bg-center');
      expect(document.querySelector('.bg-hero-gradient')).toBeInTheDocument();
      expect(document.querySelector('.fas.fa-chevron-down')).toBeInTheDocument();
    });

    test('rating section has correct structure', () => {
      render(<Hero />);

      const starsDiv = document.querySelector('.text-gold');
      expect(starsDiv).toBeInTheDocument();

      const ratingText = screen.getByText('4.9/5 (68 reviews)');
      expect(ratingText).toBeInTheDocument();
      expect(ratingText).toHaveClass('text-cream', 'font-medium');
    });

    test('price section has correct structure', () => {
      render(<Hero />);

      const priceText = screen.getByText('From R850');
      expect(priceText).toBeInTheDocument();
      expect(priceText).toHaveClass('text-gold');

      const pricePeriod = screen.getByText('per night');
      expect(pricePeriod).toBeInTheDocument();
      expect(pricePeriod).toHaveClass('text-cream');
    });

    test('all star icons are rendered correctly', () => {
      render(<Hero />);

      const stars = document.querySelectorAll('.fas.fa-star');
      expect(stars).toHaveLength(5);

      stars.forEach(star => {
        expect(star).toHaveClass('fas', 'fa-star');
      });
    });
  });

  describe('Content Accuracy', () => {
    test('displays correct property information', () => {
      render(<Hero />);
      
      // Verify all text content is accurate
      expect(screen.getByText('17 @ Peppertree')).toBeInTheDocument();
      expect(screen.getByText('Premium Self Catering Guest Room in Vredekloof, Brackenfell')).toBeInTheDocument();
      expect(screen.getByText('4.9/5 (68 reviews)')).toBeInTheDocument();
      expect(screen.getByText('From R850')).toBeInTheDocument();
      expect(screen.getByText('per night')).toBeInTheDocument();
    });

    test('rating displays exactly 5 stars', () => {
      render(<Hero />);

      const stars = document.querySelectorAll('.fas.fa-star');
      expect(stars).toHaveLength(5);

      // All should be full stars (not empty or half stars)
      stars.forEach(star => {
        expect(star).toHaveClass('fas', 'fa-star');
        expect(star).not.toHaveClass('far'); // Not empty star
        expect(star).not.toHaveClass('fa-star-half'); // Not half star
      });
    });
  });

  describe('Component Behavior', () => {
    test('scroll function only called when element exists', async () => {
      const user = userEvent.setup();
      render(<Hero />);
      
      // Test when element exists
      const mockElement = { scrollIntoView: mockScrollIntoView };
      mockGetElementById.mockReturnValueOnce(mockElement);
      
      const bookNowButton = screen.getByText('Book Now');
      await user.click(bookNowButton);
      
      expect(mockScrollIntoView).toHaveBeenCalledTimes(1);
      
      // Test when element doesn't exist
      mockGetElementById.mockReturnValueOnce(null);
      await user.click(bookNowButton);
      
      // Should still only be called once (from the first click)
      expect(mockScrollIntoView).toHaveBeenCalledTimes(1);
    });

    test('maintains consistent behavior across renders', () => {
      const { rerender } = render(<Hero />);
      
      // Initial render
      expect(screen.getByText('Book Now')).toBeInTheDocument();
      expect(document.querySelectorAll('.fas.fa-star')).toHaveLength(5); // 5 stars in rating section
      
      // Rerender
      rerender(<Hero />);
      
      // Should be the same
      expect(screen.getByText('Book Now')).toBeInTheDocument();
      expect(document.querySelectorAll('.fas.fa-star')).toHaveLength(5);
    });
  });

  describe('Integration', () => {
    test('integrates properly with scroll behavior', async () => {
      const user = userEvent.setup();
      render(<Hero />);
      
      const mockElement = {
        scrollIntoView: jest.fn()
      };
      mockGetElementById.mockReturnValue(mockElement);
      
      const bookNowButton = screen.getByText('Book Now');
      await user.click(bookNowButton);
      
      // Verify the exact behavior expected by the contact section
      expect(mockGetElementById).toHaveBeenCalledWith('contact');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ 
        behavior: 'smooth' 
      });
    });
  });
});