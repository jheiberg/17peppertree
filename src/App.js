import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Accommodation from './components/Accommodation';
import Amenities from './components/Amenities';
import Location from './components/Location';
import Contact from './components/Contact';
import Footer from './components/Footer';
import './App.css';

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