import React from 'react';

const Amenities = () => {
  const amenities = [
    {
      icon: "fas fa-snowflake",
      title: "Climate Control",
      description: "Air conditioning and heating for year-round comfort"
    },
    {
      icon: "fas fa-car",
      title: "Secure Parking",
      description: "Free secure parking included with your stay"
    },
    {
      icon: "fas fa-coffee",
      title: "Tea & Coffee",
      description: "Complimentary tea and coffee facilities"
    },
    {
      icon: "fas fa-shield-alt",
      title: "24/7 Security",
      description: "24-hour neighborhood security for peace of mind"
    },
    {
      icon: "fas fa-bolt",
      title: "Load Shedding Ready",
      description: "Backup power provisions during outages"
    },
    {
      icon: "fas fa-tshirt",
      title: "Laundry Access",
      description: "Nearby laundromat for your convenience"
    }
  ];

  return (
    <section id="amenities" className="amenities">
      <div className="container">
        <div className="section-header">
          <h2>Premium Amenities</h2>
          <p>Everything you need for a comfortable stay</p>
        </div>
        <div className="amenities-grid">
          {amenities.map((amenity, index) => (
            <div key={index} className="amenity-card">
              <div className="amenity-icon">
                <i className={amenity.icon}></i>
              </div>
              <h3>{amenity.title}</h3>
              <p>{amenity.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Amenities;