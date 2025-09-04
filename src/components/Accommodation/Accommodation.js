import React from 'react';
import './Accommodation.css';

const Accommodation = () => {
  return (
    <section id="accommodation" className="accommodation">
      <div className="container">
        <div className="section-header">
          <h2>Your Perfect Getaway</h2>
          <p>Experience comfort and luxury in our beautifully appointed guest room</p>
        </div>
        <div className="accommodation-grid">
          <div className="accommodation-images">
            <div className="main-image">
              <img 
                src="/images/main-bedroom.jpg" 
                alt="Cozy bedroom with queen bed" 
              />
            </div>
            <div className="image-gallery">
              <img 
                src="/images/bathroom.jpg" 
                alt="Modern bathroom" 
              />
              <img 
                src="/images/kitchenette.jpg" 
                alt="Kitchenette" 
              />
              <img 
                src="/images/living-area.jpg" 
                alt="Living area" 
              />
            </div>
          </div>
          <div className="accommodation-details">
            <div className="detail-card">
              <h3>Room Features</h3>
              <ul>
                <li><i className="fas fa-bed"></i> 1 Bedroom with Queen Bed</li>
                <li><i className="fas fa-shower"></i> En-suite bathroom with shower</li>
                <li><i className="fas fa-kitchen-set"></i> Fully equipped kitchenette</li>
                <li><i className="fas fa-tv"></i> TV with basic DStv channels</li>
                <li><i className="fas fa-wifi"></i> Unlimited Wi-Fi</li>
              </ul>
            </div>
            <div className="detail-card">
              <h3>Guest Information</h3>
              <ul>
                <li><i className="fas fa-users"></i> Maximum 2 adults</li>
                <li><i className="fas fa-child"></i> Adults only (no children)</li>
                <li><i className="fas fa-clock"></i> Check-in: 14:00-19:00</li>
                <li><i className="fas fa-clock"></i> Check-out: 10:00</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Accommodation;