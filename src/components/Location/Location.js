import React from 'react';
import './Location.css';

const Location = () => {
  const locationHighlights = [
    {
      icon: "fas fa-shopping-cart",
      title: "Shopping Centers",
      description: "Only 1.5km from two major shopping centers"
    },
    {
      icon: "fas fa-hospital",
      title: "Medical Care",
      description: "3.5km from Cape Gate Medi-Clinic"
    },
    {
      icon: "fas fa-map-marker-alt",
      title: "Address",
      description: "17 Peperboom Crescent, Vredekloof, Brackenfell, 7560"
    }
  ];

  return (
    <section id="location" className="location">
      <div className="container">
        <div className="location-content">
          <div className="location-info">
            <div className="section-header">
              <h2>Prime Location</h2>
              <p>Vredekloof, Brackenfell - Perfectly positioned for convenience</p>
            </div>
            <div className="location-highlights">
              {locationHighlights.map((item, index) => (
                <div key={index} className="location-item">
                  <i className={item.icon}></i>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="location-map">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3307.847!2d18.6758827!3d-33.8672569!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc5b7e1e1e1e1e%3A0x1e1e1e1e1e1e1e1e!2s17%20Peperboom%20Cres%2C%20Vredekloof%2C%20Brackenfell%2C%207560%2C%20South%20Africa!5e0!3m2!1sen!2s!4v1692722400000!5m2!1sen!2s"
              width="100%"
              height="400"
              style={{ border: 0, borderRadius: '15px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="17 @ Peppertree Location - Vredekloof, Brackenfell"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Location;