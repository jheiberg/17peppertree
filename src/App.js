import React from 'react';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import Accommodation from './components/Accommodation/Accommodation';
import Amenities from './components/Amenities/Amenities';
import Location from './components/Location/Location';
import Contact from './components/Contact/Contact';
import Footer from './components/Footer/Footer';
import './styles/base.css';

function App() {
  return (
    <div className="App">
      <Header />
      <Hero />
      <Accommodation />
      <Amenities />
      <Location />
      <Contact />
      <Footer />
    </div>
  );
}

export default App;