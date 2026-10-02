import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { ABOUT_IMG_URL } from '../utils/constants';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { ease: 'easeInOut' } }
};

const underlineAnimate = {
    hidden: { opacity: 0, pathLength: 0 },
    visible: { opacity: 1, pathLength: 1, transition: { delay: 0.8, duration: 1 } },
};

const textReveal = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.6 } }
};

const About = () => {
    return (
        <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-gray-50 min-h-screen pb-20 pt-6"
        >
            {/* Main Container - Width matched with Products and ProductDetail */}
            <div className='max-w-[1500px] w-[95vw] lg:w-[90vw] mx-auto'>
                
                {/* Modern Breadcrumb Navigation */}
                <nav className="flex items-center text-sm text-gray-500 mb-6 space-x-2">
                    <Link to='/' className="hover:text-blue-600 hover:underline">Home</Link>
                    <span className="text-gray-400">›</span>
                    <span className="text-gray-900 font-medium">About Us</span>
                </nav>

                {/* Main Content Wrapped in an E-commerce style Card */}
                <div className='bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden p-6 sm:p-10 lg:p-16'>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center'>
                        
                        {/* LEFT SIDE: Image with subtle styling */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7 }}
                            className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-lg border border-gray-100"
                        >
                            {/* A slight overlay gradient for premium look */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-gray-900/10 to-transparent z-10"></div>
                            <img 
                                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" 
                                src={ABOUT_IMG_URL}
                                alt="Our Story" 
                            />
                        </motion.div>

                        {/* RIGHT SIDE: Text Content */}
                        <div className="flex flex-col justify-center">
                            
                            {/* Animated Title with SVG */}
                            <div className="relative inline-block mb-8 w-max">
                                <motion.h2 
                                    className='text-3xl lg:text-5xl font-black tracking-tight text-gray-900'
                                    initial={{opacity: 0, y: 30}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{duration: 0.5}}
                                >
                                    Our Story
                                </motion.h2>
                                <svg
                                    className="absolute -bottom-3 left-0 w-full h-4 stroke-blue-600 z-0"
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    strokeWidth={8}
                                    viewBox="0 0 422 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <motion.path
                                        d="M3 9C118.957 4.47226 364.497 -1.86658 419 9"
                                        variants={underlineAnimate}
                                        initial="hidden"
                                        animate="visible"
                                    />
                                </svg>
                            </div>

                            {/* Text Paragraphs */}
                            <div className="space-y-6">
                                <motion.p 
                                    variants={textReveal}
                                    className='text-base lg:text-lg leading-relaxed text-gray-600'
                                >
                                    At <span className="font-bold text-gray-900">Tech Haven Computers</span>, we are dedicated to providing top-of-the-line computer hardware and accessories tailored to meet the diverse needs of our customers. Whether you are a casual user, a gaming enthusiast, or a professional seeking high-performance machines, our extensive lineup of computers, laptops, and peripherals ensures that we have the perfect solution for everyone.
                                </motion.p>
                                
                                <motion.p 
                                    variants={textReveal}
                                    className='text-base lg:text-lg leading-relaxed text-gray-600'
                                >
                                    Our mission is to empower individuals and businesses with cutting-edge technology that enhances productivity and creativity. We believe that the right tools can transform ideas into reality, and we are committed to guiding you on your journey through the fascinating world of technology.
                                </motion.p>

                                <motion.p 
                                    variants={textReveal}
                                    className='text-base lg:text-lg leading-relaxed text-gray-600'
                                >
                                    At Future Shop, customer satisfaction is at the heart of everything we do. Our knowledgeable staff is always on hand to assist you in selecting the right orders and answering any questions you may have. We pride ourselves on delivering personalized service, ensuring that you're not just another sale but a valued member of our community.
                                </motion.p>

                                {/* Highlighted Quote/Conclusion */}
                                <motion.div 
                                    variants={textReveal}
                                    className="pt-6 mt-6 border-t border-gray-200"
                                >
                                    <p className="text-lg lg:text-xl font-bold text-blue-600 italic">
                                        "My Shop — Your Ultimate Destination for Technology Solutions!"
                                    </p>
                                </motion.div>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
        </motion.main>
    );
};

export default About;