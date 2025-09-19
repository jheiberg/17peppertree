import React from 'react';

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
    <section id="location" className="section-padding bg-warm-white">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-16 items-center">
          <div>
            <div className="section-header text-left mb-8">
              <h2 className="section-title text-left">Prime Location</h2>
              <p className="section-subtitle text-left">Vredekloof, Brackenfell - Perfectly positioned for convenience</p>
            </div>
            <div className="flex flex-col gap-8">
              {locationHighlights.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-6 p-6 bg-white rounded-2xl shadow-soft"
                >
                  <i className={`${item.icon} text-2xl text-accent mt-2`}></i>
                  <div>
                    <h4 className="text-primary mb-2 text-lg font-display font-semibold">{item.title}</h4>
                    <p className="text-text-color">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="h-96 rounded-2xl overflow-hidden shadow-soft relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3307.847!2d18.6758827!3d-33.8672569!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc5b7e1e1e1e1e%3A0x1e1e1e1e1e1e1e1e!2s17%20Peperboom%20Cres%2C%20Vredekloof%2C%20Brackenfell%2C%207560%2C%20South%20Africa!5e0!3m2!1sen!2s!4v1692722400000!5m2!1sen!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="17 @ Peppertree Location - Vredekloof, Brackenfell"
              className="brightness-75 contrast-110"
            ></iframe>
            <div className="absolute inset-0 bg-black/20 pointer-events-none rounded-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Location;