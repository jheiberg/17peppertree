import React from 'react';

const Accommodation = () => {
  return (
    <section id="accommodation" className="section-padding bg-warm-white">
      <div className="container-custom">
        <div className="section-header">
          <h2 className="section-title">Your Perfect Getaway</h2>
          <p className="section-subtitle">Experience comfort and luxury in our beautifully appointed guest room</p>
        </div>
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-16 items-start">
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl overflow-hidden shadow-soft">
              <img
                src="/images/main-bedroom.jpg"
                alt="Cozy bedroom with queen bed"
                className="w-full h-96 object-cover transition-transform duration-300 filter-sepia hover:filter-sepia-hover hover:scale-105"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <img
                src="/images/bathroom.jpg"
                alt="Modern bathroom"
                className="w-full h-28 object-cover rounded-xl transition-transform duration-300 cursor-pointer filter-sepia hover:filter-sepia-hover hover:scale-105"
              />
              <img
                src="/images/kitchenette.jpg"
                alt="Kitchenette"
                className="w-full h-28 object-cover rounded-xl transition-transform duration-300 cursor-pointer filter-sepia hover:filter-sepia-hover hover:scale-105"
              />
              <img
                src="/images/living-area.jpg"
                alt="Living area"
                className="w-full h-28 object-cover rounded-xl transition-transform duration-300 cursor-pointer filter-sepia hover:filter-sepia-hover hover:scale-105"
              />
            </div>
          </div>
          <div className="flex flex-col gap-8">
            <div className="card border-l-4 border-accent">
              <h3 className="text-primary mb-6 text-2xl font-display">Room Features</h3>
              <ul className="list-none space-y-4">
                <li className="flex items-center gap-4 text-text-color">
                  <i className="fas fa-bed text-accent w-5"></i>
                  1 Bedroom with Queen Bed
                </li>
                <li className="flex items-center gap-4 text-text-color">
                  <i className="fas fa-shower text-accent w-5"></i>
                  En-suite bathroom with shower
                </li>
                <li className="flex items-center gap-4 text-text-color">
                  <i className="fas fa-kitchen-set text-accent w-5"></i>
                  Fully equipped kitchenette
                </li>
                <li className="flex items-center gap-4 text-text-color">
                  <i className="fas fa-tv text-accent w-5"></i>
                  TV with basic DStv channels
                </li>
                <li className="flex items-center gap-4 text-text-color">
                  <i className="fas fa-wifi text-accent w-5"></i>
                  Unlimited Wi-Fi
                </li>
              </ul>
            </div>
            <div className="card border-l-4 border-accent">
              <h3 className="text-primary mb-6 text-2xl font-display">Guest Information</h3>
              <ul className="list-none space-y-4">
                <li className="flex items-center gap-4 text-text-color">
                  <i className="fas fa-users text-accent w-5"></i>
                  Maximum 2 adults
                </li>
                <li className="flex items-center gap-4 text-text-color">
                  <i className="fas fa-child text-accent w-5"></i>
                  Adults only (no children)
                </li>
                <li className="flex items-center gap-4 text-text-color">
                  <i className="fas fa-clock text-accent w-5"></i>
                  Check-in: 14:00-19:00
                </li>
                <li className="flex items-center gap-4 text-text-color">
                  <i className="fas fa-clock text-accent w-5"></i>
                  Check-out: 10:00
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Accommodation;