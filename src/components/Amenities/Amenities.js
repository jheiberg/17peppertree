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
      title: "Free Parking",
      description: "Free parking included with your stay"
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
      icon: "fas fa-tshirt",
      title: "Laundry Access",
      description: "Nearby laundromat for your convenience"
    }
  ];

  return (
    <section id="amenities" className="section-padding bg-gradient-to-br from-cream to-warm-white">
      <div className="container-custom">
        <div className="section-header">
          <h2 className="section-title">Premium Amenities</h2>
          <p className="section-subtitle">Everything you need for a comfortable stay</p>
        </div>
        <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-8">
          {amenities.map((amenity, index) => (
            <div
              key={index}
              className="bg-white p-10 rounded-3xl text-center shadow-soft transition-all duration-300 hover:-translate-y-3 hover:shadow-brown border border-primary/10"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <i className={`${amenity.icon} text-2xl text-white`}></i>
              </div>
              <h3 className="text-primary mb-4 text-xl font-display">{amenity.title}</h3>
              <p className="text-text-color leading-relaxed">{amenity.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Amenities;