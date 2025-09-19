import React from 'react';

const Footer = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-dark-brown text-cream py-12">
      <div className="container-custom">
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8 mb-8">
          <div>
            <h3 className="text-secondary mb-4 text-xl font-display">17 @ Peppertree</h3>
            <p className="leading-relaxed mb-2">Premium self-catering accommodation in the heart of Brackenfell</p>
          </div>
          <div>
            <h4 className="text-secondary mb-4 text-lg font-display">Contact</h4>
            <p className="leading-relaxed mb-2">Phone: 063 630 7345</p>
            <p className="leading-relaxed mb-2">
              17 Peperboom Crescent<br />
              Vredekloof, Brackenfell, 7560
            </p>
          </div>
          <div>
            <h4 className="text-secondary mb-4 text-lg font-display">Quick Links</h4>
            <ul className="list-none space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection('accommodation')}
                  className="bg-transparent border-none text-cream cursor-pointer hover:text-secondary transition-colors duration-300 p-0 text-base font-body"
                >
                  Accommodation
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('amenities')}
                  className="bg-transparent border-none text-cream cursor-pointer hover:text-secondary transition-colors duration-300 p-0 text-base font-body"
                >
                  Amenities
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('location')}
                  className="bg-transparent border-none text-cream cursor-pointer hover:text-secondary transition-colors duration-300 p-0 text-base font-body"
                >
                  Location
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-secondary/20 pt-4 text-center">
          <p className="text-warm-white/70">&copy; 2024 17 @ Peppertree. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;