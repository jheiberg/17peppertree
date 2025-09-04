import React from 'react';
import './Footer.css';

const Footer = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>17 @ Peppertree</h3>
            <p>Premium self-catering accommodation in the heart of Brackenfell</p>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Phone: 063 630 7345</p>
            <p>17 Peperboom Crescent<br />Vredekloof, Brackenfell, 7560</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><button onClick={() => scrollToSection('accommodation')}>Accommodation</button></li>
              <li><button onClick={() => scrollToSection('amenities')}>Amenities</button></li>
              <li><button onClick={() => scrollToSection('location')}>Location</button></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 17 @ Peppertree. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;