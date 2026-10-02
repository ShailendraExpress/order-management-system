import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HERO_URL } from "../../utils/constants";

const Hero = () => {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 30 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 60,
                damping: 15,
            },
        },
    };

    const floatHover = {
        y: [0, -10, 0],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    };

    return (
        <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#FAFCFF] pt-20 pb-24">
            
            {/* Modern Ambient Glowing Orbs */}
            <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-orange-400/20 blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-[1600px] w-full mx-auto px-6 sm:px-8 lg:px-12">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-center"
                >
                    {/* --- LEFT COLUMN: TEXT CONTENT --- */}
                    <div className="flex flex-col items-start text-left w-full xl:pr-10">
                        
                        <motion.div variants={item} className="mb-6 inline-flex">
                            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-50/80 border border-blue-100/50 backdrop-blur-md text-blue-600 font-semibold text-sm tracking-wide shadow-sm">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                India's Trusted Electronics Store
                            </span>
                        </motion.div>

                        <motion.h1 variants={item} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                            Smart Shopping <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                Tech Products
                            </span>
                        </motion.h1>

                        <motion.p variants={item} className="text-lg sm:text-xl text-slate-500 mt-6 leading-relaxed max-w-xl font-medium">
                            Discover premium laptops, smartphones, and smart gadgets from the world's most trusted brands. Unbeatable prices, secure payments, and lightning-fast delivery.
                        </motion.p>

                        <motion.div variants={item} className="flex flex-wrap items-center gap-4 mt-10">
                            <Link to="/products">
                                <button className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-full font-semibold text-base overflow-hidden transition-all hover:bg-blue-600 hover:shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] active:scale-95">
                                    <span>Explore Collection</span>
                                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </button>
                            </Link>
                            <Link to="/about">
                                <button className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-full font-semibold text-base transition-all hover:border-slate-400 hover:bg-slate-50 active:scale-95 shadow-sm">
                                    View Deals
                                </button>
                            </Link>
                        </motion.div>

                        {/* Modernized Stats Row */}
                        <motion.div variants={item} className="grid grid-cols-3 gap-6 sm:gap-10 mt-14 pt-8 border-t border-slate-200/60 w-full max-w-lg">
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-slate-900">12K+</span>
                                <span className="text-sm font-medium text-slate-500 mt-1">Happy Customers</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-blue-600">500+</span>
                                <span className="text-sm font-medium text-slate-500 mt-1">Premium Items</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-orange-500">24/7</span>
                                <span className="text-sm font-medium text-slate-500 mt-1">Expert Support</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* --- RIGHT COLUMN: HERO IMAGE --- */}
                    <motion.div variants={item} className="relative w-full h-full flex items-center justify-end mt-12 lg:mt-0">
                        <div className="relative w-full max-w-[850px] aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] xl:aspect-[16/10]">
                            
                            {/* Main Image */}
                            <img
                                src={HERO_URL}
                                alt="Premium Tech Products"
                                className="w-full h-full object-cover rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5"
                            />

                            {/* Glassmorphic Badge 1: Discount */}
                            <motion.div 
                                animate={floatHover}
                                className="absolute -top-6 -left-4 sm:top-6 sm:-left-12 p-5 bg-white/80 backdrop-blur-xl border border-white rounded-2xl shadow-xl z-20 flex flex-col"
                            >
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Offer</span>
                                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-500">
                                    20% OFF
                                </span>
                            </motion.div>

                            {/* Glassmorphic Badge 2: Rating */}
                            <motion.div 
                                animate={{ y: [0, 10, 0], transition: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
                                className="absolute bottom-10 -right-4 sm:bottom-16 sm:-right-8 p-4 bg-white/80 backdrop-blur-xl border border-white rounded-2xl shadow-xl z-20 flex items-center gap-3"
                            >
                                <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full text-amber-500 text-xl">
                                    ⭐
                                </div>
                                <div className="flex flex-col pr-2">
                                    <span className="text-2xl font-bold text-slate-900 leading-none">4.9</span>
                                    <span className="text-xs font-medium text-slate-500 mt-1">Customer Rating</span>
                                </div>
                            </motion.div>

                            {/* Glassmorphic Badge 3: Orders */}
                            <motion.div 
                                animate={{ y: [0, -8, 0], transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 } }}
                                className="absolute bottom-4 left-4 sm:bottom-8 sm:left-[-2rem] px-6 py-4 bg-blue-600/90 backdrop-blur-md border border-blue-400/30 text-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(37,99,235,0.6)] z-20"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-bold leading-none">5000+</span>
                                        <span className="text-sm font-medium text-blue-100 mt-1">Orders Delivered</span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;