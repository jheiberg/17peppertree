import React, { useState, useEffect } from 'react';

const SpecialOffers = () => {
  const [specialRates, setSpecialRates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecialRates();
  }, []);

  const fetchSpecialRates = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/rates/?type=special&active=true`
      );
      
      console.log('SpecialOffers: Fetching rates...');
      
      if (response.ok) {
        const data = await response.json();
        console.log('SpecialOffers: API response:', data);
        
        if (data.rates && data.rates.length > 0) {
          // Show current and upcoming specials (not expired)
          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0); // Start of today
          
          const activeSpecials = data.rates.filter(rate => {
            const endDate = new Date(rate.end_date);
            endDate.setHours(23, 59, 59, 999); // End of end date
            const isValid = endDate >= currentDate;
            console.log(`SpecialOffers: Rate "${rate.description}" - End: ${rate.end_date}, Valid: ${isValid}`);
            return isValid; // Show if end date is today or in future
          });
          
          console.log('SpecialOffers: Active specials count:', activeSpecials.length);
          setSpecialRates(activeSpecials);
        } else {
          console.log('SpecialOffers: No rates in response');
        }
      } else {
        console.log('SpecialOffers: API response not OK:', response.status);
      }
    } catch (error) {
      console.error('SpecialOffers: Failed to fetch special rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const isCurrentlyActive = (startDate, endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  };

  const calculateSavings = (specialAmount, guests) => {
    // Get base rate for comparison
    const baseRates = { 1: 850, 2: 950 };
    const baseRate = baseRates[guests] || 850;
    const savings = baseRate - specialAmount;
    const percentage = Math.round((savings / baseRate) * 100);
    return { savings, percentage };
  };

  console.log('SpecialOffers: Render - loading:', loading, 'rates count:', specialRates.length);
  
  if (loading || specialRates.length === 0) {
    console.log('SpecialOffers: Not showing banner - loading or no rates');
    return null;
  }
  
  console.log('SpecialOffers: Showing banner with', specialRates.length, 'rates');

  return (
    <section className="bg-gradient-to-r from-gold via-accent to-gold py-2 md:py-4 relative overflow-hidden pt-[75px] md:pt-[90px] pb-2 md:pb-4">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="px-2 md:container-custom relative z-10">
        <div className="flex flex-col items-center justify-center text-white">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-star text-sm md:text-2xl animate-pulse"></i>
            <span className="text-sm md:text-lg font-display font-bold">Special Offers</span>
            <i className="fas fa-star text-sm md:text-2xl animate-pulse"></i>
          </div>
          
          <div className="flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-2 md:gap-6 w-full">
            {specialRates.map((rate, index) => {
              const { savings, percentage } = calculateSavings(rate.amount, rate.guests);
              const isActive = isCurrentlyActive(rate.start_date, rate.end_date);
              
              return (
                <div 
                  key={rate.id || index}
                  className="bg-white/20 backdrop-blur-sm px-3 py-2 md:px-6 md:py-3 rounded-lg border border-white/30 w-full md:w-auto"
                >
                  <div className="flex items-center justify-between md:gap-3">
                    <div className="text-center">
                      <div className="text-xl md:text-3xl font-bold">R{rate.amount.toFixed(0)}</div>
                      <div className="text-[10px] md:text-xs opacity-90">{rate.guests}g</div>
                    </div>
                    
                    <div className="flex-1 pl-2 md:border-l-2 md:border-white/50 md:pl-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-xs md:text-sm">{rate.description}</div>
                        {!isActive && (
                          <span className="text-[10px] md:text-xs bg-white/30 px-1.5 py-0.5 rounded-full whitespace-nowrap">Soon</span>
                        )}
                      </div>
                      <div className="text-[10px] md:text-xs opacity-90">
                        {formatDate(rate.start_date)} - {formatDate(rate.end_date)}
                      </div>
                      <div className="text-[10px] md:text-xs font-bold mt-0.5">
                        Save R{savings} ({percentage}% off!)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpecialOffers;
