import React from 'react';

const Hero = () => {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="h-screen bg-cover bg-center bg-fixed flex items-center justify-center text-center text-white relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('./images/hero-background.png')`
      }}
    >
      <div className="absolute inset-0 bg-hero-gradient"></div>
      <div className="relative z-10 max-w-4xl px-8">
        <h1 className="text-6xl lg:text-6xl md:text-5xl sm:text-4xl mb-4 text-shadow text-warm-white font-display">
          17 @ Peppertree
        </h1>
        <p className="text-xl lg:text-xl md:text-lg sm:text-base mb-8 text-cream">
          Premium Self Catering Guest Room in Vredekloof, Brackenfell
        </p>
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="text-gold text-xl">
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
          </div>
          <span className="text-cream font-medium">4.9/5 (68 reviews)</span>
        </div>
        <div className="mb-8">
          <span className="text-5xl lg:text-5xl md:text-4xl sm:text-3xl font-bold text-gold mr-2">
            From R850
          </span>
          <span className="text-xl lg:text-xl md:text-lg sm:text-base text-cream">
            per night
          </span>
        </div>
        <button
          onClick={scrollToContact}
          className="btn-primary"
        >
          Book Now
        </button>
      </div>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-slow">
        <i className="fas fa-chevron-down text-2xl text-warm-white"></i>
      </div>
    </section>
  );
};

export default Hero;