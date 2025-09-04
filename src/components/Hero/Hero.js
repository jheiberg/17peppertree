import React from 'react';
import './Hero.css';

const Hero = () => {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="hero">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1 className="hero-title">17 @ Peppertree</h1>
        <p className="hero-subtitle">Premium Self Catering Guest Room in Vredekloof, Brackenfell</p>
        <div className="hero-rating">
          <div className="stars">
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
          </div>
          <span className="rating-text">4.9/5 (68 reviews)</span>
        </div>
        <div className="hero-price">
          <span className="price">From R850</span>
          <span className="price-period">per night</span>
        </div>
        <button onClick={scrollToContact} className="cta-button">Book Now</button>
      </div>
      <div className="scroll-indicator">
        <i className="fas fa-chevron-down"></i>
      </div>
    </section>
  );
};

export default Hero;