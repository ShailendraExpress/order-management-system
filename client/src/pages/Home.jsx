import React from 'react';
import { motion } from 'framer-motion';

import Hero from "../components/home/Hero";
import Overview from '../components/home/Overview';
import FeaturedProducts from '../components/home/FeaturedProducts';
import TheServices from '../components/home/TheServices';
import TheContact from '../components/home/TheContact';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: .3 } },
  exit: { x: '-100vw', transition: { ease: 'easeInOut' } }
};

const Home = () => {
  return (
    <motion.main
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      // text-sm (14px) se font official lagega, space-y-8 se components ke beech ki fालतू padding kam ho jayegi
      className="text-sm antialiased text-gray-800 bg-white space-y-8 md:space-y-12 pb-10"
    >
      <Hero />
      <Overview />
      <FeaturedProducts />
      <TheServices />
      <TheContact />
    </motion.main>
  );
};

export default Home;