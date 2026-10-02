import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiHome, FiChevronRight, FiSliders } from 'react-icons/fi';

import Filters from '../components/products/Filters';
import Sort from '../components/products/Sort';
import ProductsList from '../components/products/ProductsList';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { x: '-100vw', transition: { ease: 'easeInOut' } }
};

const Products = () => {
    const filters = useSelector((state) => state.products.filters);

    return (
        <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-slate-50/70 min-h-screen pb-24 pt-6 font-sans text-slate-800"
        >
            {/* Main Container */}
            <div className='max-w-[1580px] w-[94vw] mx-auto'>
                
                {/* Modern Breadcrumb Navigation */}
                <nav className="flex items-center text-xs sm:text-sm text-slate-500 mb-6 space-x-2 font-medium">
                    <Link to='/' className="flex items-center gap-1 hover:text-slate-900 transition-colors">
                        <FiHome size={14} /> Home
                    </Link>
                    <FiChevronRight size={14} className="text-slate-400" />
                    <span className="text-slate-900 font-semibold">Catalog</span>
                </nav>

                {/* Page Header Title Section */}
                <div className="mb-8 bg-white border border-slate-200/80 rounded-2xl p-6 sm:px-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Explore Products</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">Discover our latest collection of premium tech, electronics, and essentials.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200/60 w-fit">
                        <FiSliders size={14} className="text-slate-900" />
                        <span>Advanced Filtering Active</span>
                    </div>
                </div>
                
                {/* Grid Layout - 1 Column for Filter, 4 Columns for Products */}
                <div className='grid grid-cols-1 lg:grid-cols-5 gap-8 items-start'>
                    
                    {/* Left Sidebar (Filters) */}
                    <div className='sticky top-24 lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs'>
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Filters</h2>
                        </div>
                        <Filters filters={filters}/>
                    </div>

                    {/* Right Side (Sort + Product List) */}
                    <div className='w-full lg:col-span-4'>
                        <div className='w-full flex flex-col gap-6'>
                            
                            {/* Sort Section */}
                            <div className='bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between'>
                                <Sort/>
                            </div>
                            
                            {/* Products List */}
                            <div className='w-full'>
                                <ProductsList itemsPerPage={8}/>
                            </div>
                            
                        </div>
                    </div>
                    
                </div>
            </div>
        </motion.main>
    );
};

export default Products;