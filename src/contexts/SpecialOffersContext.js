import React, { createContext, useContext, useState, useEffect } from 'react';

const SpecialOffersContext = createContext();

export const useSpecialOffers = () => {
  const context = useContext(SpecialOffersContext);
  if (!context) {
    throw new Error('useSpecialOffers must be used within SpecialOffersProvider');
  }
  return context;
};

export const SpecialOffersProvider = ({ children }) => {
  const [specialRates, setSpecialRates] = useState([]);
  const [baseRates, setBaseRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasActiveSpecials, setHasActiveSpecials] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    try {
      // Fetch both special rates and base rates in parallel
      const [specialResponse, baseResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/rates/?type=special&active=true`),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/rates/base`)
      ]);
      
      console.log('SpecialOffersContext: Fetching rates...');
      
      // Process base rates
      if (baseResponse.ok) {
        const baseData = await baseResponse.json();
        console.log('SpecialOffersContext: Base rates response:', baseData);
        
        if (baseData.rates && baseData.rates.length > 0) {
          // Create a map of guest count to base rate
          const ratesMap = {};
          baseData.rates.forEach(rate => {
            ratesMap[rate.guests] = rate.amount;
          });
          setBaseRates(ratesMap);
          console.log('SpecialOffersContext: Base rates map:', ratesMap);
        }
      }
      
      // Process special rates
      if (specialResponse.ok) {
        const data = await specialResponse.json();
        console.log('SpecialOffersContext: Special rates response:', data);
        
        if (data.rates && data.rates.length > 0) {
          // Show current and upcoming specials (not expired)
          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0); // Start of today
          
          const activeSpecials = data.rates.filter(rate => {
            const endDate = new Date(rate.end_date);
            endDate.setHours(23, 59, 59, 999); // End of end date
            const isValid = endDate >= currentDate;
            console.log(`SpecialOffersContext: Rate "${rate.description}" - End: ${rate.end_date}, Valid: ${isValid}`);
            return isValid; // Show if end date is today or in future
          });
          
          console.log('SpecialOffersContext: Active specials count:', activeSpecials.length);
          setSpecialRates(activeSpecials);
          setHasActiveSpecials(activeSpecials.length > 0);
        } else {
          console.log('SpecialOffersContext: No rates in response');
          setHasActiveSpecials(false);
        }
      } else {
        console.log('SpecialOffersContext: API response not OK:', specialResponse.status);
        
        // If API error (not 404), retry
        if (retryCount < maxRetries && specialResponse.status >= 500) {
          console.log(`SpecialOffersContext: Retrying fetch (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => fetchRates(retryCount + 1), retryDelay);
          return;
        }
        
        setHasActiveSpecials(false);
        setLoading(false);
      }
      
      // Success path
      setLoading(false);
      
    } catch (error) {
      console.error('SpecialOffersContext: Failed to fetch rates:', error);
      
      // Retry on network error
      if (retryCount < maxRetries) {
        console.log(`SpecialOffersContext: Retrying fetch after error (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => fetchRates(retryCount + 1), retryDelay);
        return;
      }
      
      setHasActiveSpecials(false);
      setLoading(false);
    }
  };

  return (
    <SpecialOffersContext.Provider value={{ specialRates, baseRates, loading, hasActiveSpecials }}>
      {children}
    </SpecialOffersContext.Provider>
  );
};
