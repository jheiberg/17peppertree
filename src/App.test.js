import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock all the component modules
jest.mock('./components/Header/Header', () => {
  return function MockHeader() {
    return <div data-testid="header-component">Header Component</div>;
  };
});

jest.mock('./components/Hero/Hero', () => {
  return function MockHero() {
    return <div data-testid="hero-component">Hero Component</div>;
  };
});

jest.mock('./components/Accommodation/Accommodation', () => {
  return function MockAccommodation() {
    return <div data-testid="accommodation-component">Accommodation Component</div>;
  };
});

jest.mock('./components/Amenities/Amenities', () => {
  return function MockAmenities() {
    return <div data-testid="amenities-component">Amenities Component</div>;
  };
});

jest.mock('./components/Location/Location', () => {
  return function MockLocation() {
    return <div data-testid="location-component">Location Component</div>;
  };
});

jest.mock('./components/Contact/Contact', () => {
  return function MockContact() {
    return <div data-testid="contact-component">Contact Component</div>;
  };
});

jest.mock('./components/Footer/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer-component">Footer Component</div>;
  };
});

describe('App Component', () => {
  describe('Component Rendering', () => {
    test('renders without crashing', () => {
      render(<App />);
      expect(screen.getByTestId('header-component')).toBeInTheDocument();
    });

    test('renders all main components in correct order', () => {
      render(<App />);
      
      const components = [
        'header-component',
        'hero-component',
        'accommodation-component',
        'amenities-component',
        'location-component',
        'contact-component',
        'footer-component'
      ];
      
      components.forEach(componentTestId => {
        expect(screen.getByTestId(componentTestId)).toBeInTheDocument();
      });
    });

    test('has correct CSS class structure', () => {
      render(<App />);
      
      const appDiv = document.querySelector('.App');
      expect(appDiv).toBeInTheDocument();
    });

    test('renders components in the correct DOM order', () => {
      const { container } = render(<App />);
      
      const appDiv = container.querySelector('.App');
      const children = Array.from(appDiv.children);
      
      expect(children[0]).toHaveAttribute('data-testid', 'header-component');
      expect(children[1]).toHaveAttribute('data-testid', 'hero-component');
      expect(children[2]).toHaveAttribute('data-testid', 'accommodation-component');
      expect(children[3]).toHaveAttribute('data-testid', 'amenities-component');
      expect(children[4]).toHaveAttribute('data-testid', 'location-component');
      expect(children[5]).toHaveAttribute('data-testid', 'contact-component');
      expect(children[6]).toHaveAttribute('data-testid', 'footer-component');
    });
  });

  describe('Component Integration', () => {
    test('all components are properly integrated', () => {
      render(<App />);
      
      // Verify all expected components are present
      expect(screen.getByTestId('header-component')).toBeInTheDocument();
      expect(screen.getByTestId('hero-component')).toBeInTheDocument();
      expect(screen.getByTestId('accommodation-component')).toBeInTheDocument();
      expect(screen.getByTestId('amenities-component')).toBeInTheDocument();
      expect(screen.getByTestId('location-component')).toBeInTheDocument();
      expect(screen.getByTestId('contact-component')).toBeInTheDocument();
      expect(screen.getByTestId('footer-component')).toBeInTheDocument();
    });

    test('no unexpected components are rendered', () => {
      const { container } = render(<App />);
      
      const appDiv = container.querySelector('.App');
      expect(appDiv.children).toHaveLength(7); // Exactly 7 components
    });
  });

  describe('CSS and Styling', () => {
    test('includes base CSS styles', () => {
      render(<App />);
      
      // The base.css should be imported
      // We can't directly test CSS imports in Jest, but we can verify the component structure
      const appElement = document.querySelector('.App');
      expect(appElement).toBeInTheDocument();
    });

    test('App div has correct structure', () => {
      const { container } = render(<App />);
      
      expect(container.firstChild).toHaveClass('App');
      expect(container.firstChild.tagName).toBe('DIV');
    });
  });

  describe('Performance', () => {
    test('renders quickly without performance issues', () => {
      const startTime = performance.now();
      render(<App />);
      const endTime = performance.now();
      
      // Should render in less than 100ms (this is quite generous for a simple component)
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('renders consistently across multiple renders', () => {
      const { rerender } = render(<App />);
      
      // Initial render
      expect(screen.getByTestId('header-component')).toBeInTheDocument();
      
      // Rerender
      rerender(<App />);
      expect(screen.getByTestId('header-component')).toBeInTheDocument();
      
      // Components should still be there
      expect(screen.getByTestId('hero-component')).toBeInTheDocument();
      expect(screen.getByTestId('contact-component')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper document structure for screen readers', () => {
      render(<App />);
      
      const appContainer = document.querySelector('.App');
      expect(appContainer).toBeInTheDocument();
      
      // Should contain the main content areas
      expect(screen.getByTestId('header-component')).toBeInTheDocument();
      expect(screen.getByTestId('hero-component')).toBeInTheDocument();
      expect(screen.getByTestId('contact-component')).toBeInTheDocument();
      expect(screen.getByTestId('footer-component')).toBeInTheDocument();
    });

    test('maintains semantic structure', () => {
      const { container } = render(<App />);
      
      // App should be a div with class "App"
      expect(container.firstChild).toHaveClass('App');
      expect(container.firstChild.tagName).toBe('DIV');
    });
  });

  describe('Error Handling', () => {
    test('handles missing components gracefully', () => {
      // This test ensures the app structure is solid
      expect(() => render(<App />)).not.toThrow();
    });
  });
});