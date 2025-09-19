import React, { useState } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full bg-primary/95 backdrop-blur-custom z-50 py-4 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-5 flex justify-between items-center">
        <div className="nav-logo">
          <h2 className="text-warm-white text-3xl lg:text-3xl md:text-2xl sm:text-xl m-0 font-display">
            17 @ Peppertree
          </h2>
        </div>
        <ul className={`${
          isMenuOpen
            ? 'fixed left-0 top-[70px] flex-col bg-primary/98 backdrop-blur-custom w-full text-center transition-all duration-300 py-8 shadow-lg rounded-b-2xl z-50'
            : 'hidden lg:flex'
        } lg:flex list-none gap-8`}>
          <li className={isMenuOpen ? 'my-4 opacity-0 transform translate-y-5 animate-fade-in-up' : ''}>
            <button
              onClick={() => scrollToSection('home')}
              className="nav-link"
            >
              Home
            </button>
          </li>
          <li className={isMenuOpen ? 'my-4 opacity-0 transform translate-y-5 animate-fade-in-up delay-100' : ''}>
            <button
              onClick={() => scrollToSection('accommodation')}
              className="nav-link"
            >
              Accommodation
            </button>
          </li>
          <li className={isMenuOpen ? 'my-4 opacity-0 transform translate-y-5 animate-fade-in-up delay-200' : ''}>
            <button
              onClick={() => scrollToSection('amenities')}
              className="nav-link"
            >
              Amenities
            </button>
          </li>
          <li className={isMenuOpen ? 'my-4 opacity-0 transform translate-y-5 animate-fade-in-up delay-300' : ''}>
            <button
              onClick={() => scrollToSection('location')}
              className="nav-link"
            >
              Location
            </button>
          </li>
          <li className={isMenuOpen ? 'my-4 opacity-0 transform translate-y-5 animate-fade-in-up delay-500' : ''}>
            <button
              onClick={() => scrollToSection('contact')}
              className="nav-link"
            >
              Contact
            </button>
          </li>
        </ul>
        <div
          className="lg:hidden flex flex-col cursor-pointer w-6 h-6"
          onClick={toggleMenu}
        >
          <span className="w-6 h-0.5 bg-warm-white my-0.5 transition-all duration-300"></span>
          <span className="w-6 h-0.5 bg-warm-white my-0.5 transition-all duration-300"></span>
          <span className="w-6 h-0.5 bg-warm-white my-0.5 transition-all duration-300"></span>
        </div>
      </div>
    </nav>
  );
};

export default Header;