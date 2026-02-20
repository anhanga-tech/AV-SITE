import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import VenueMap from './VenueMap';
import LineupSection from './LineupSection';
import PackageFeatures from './PackageFeatures';
import WhyUs from './WhyUs';
import CTASection from './CTASection';
import Footer from './Footer';
import WhatsAppFloating from './WhatsAppFloating';

function LollapaloozaApp() {

  return (
    <div className="landing-lollapalooza font-sans antialiased text-gray-800 bg-white selection:bg-anhanga-yellow selection:text-anhanga-darkBlue">
      <Navbar />
      <Hero />
      <VenueMap />
      <PackageFeatures />
      <LineupSection />
      <WhyUs />
      <CTASection />
      <Footer />
      <WhatsAppFloating />
    </div>
  );
}

export default LollapaloozaApp;
