import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaChevronRight } from 'react-icons/fa';

const PageHero = ({ title, product }) => {
  return (
    <section 
      className={`w-full bg-white border-b border-gray-200 transition-all duration-300 ${
        product ? 'py-3 sm:py-4' : 'py-8 sm:py-12 bg-gray-50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col gap-3"
        >
          
          {/* Breadcrumb Navigation - Moved to the top for standard E-commerce UX */}
          <nav className="flex items-center text-sm font-medium text-gray-500 gap-2 flex-wrap">
            
            <Link 
              to="/" 
              className="flex items-center gap-1.5 hover:text-blue-600 transition-colors duration-200"
              aria-label="Home"
            >
              <FaHome className="text-base pb-[1px]" />
              <span className="hidden sm:inline-block">Home</span>
            </Link>
            
            <FaChevronRight className="text-gray-300 text-[10px]" />
            
            {product && (
              <>
                <Link 
                  to="/products" 
                  className="hover:text-blue-600 transition-colors duration-200 capitalize"
                >
                  Products
                </Link>
                <FaChevronRight className="text-gray-300 text-[10px]" />
              </>
            )}
            
            {/* Current Page Indicator */}
            <span className={`${product ? 'text-gray-900 font-semibold' : 'text-blue-600'} truncate max-w-[150px] sm:max-w-md capitalize`}>
              {title}
            </span>
            
          </nav>

          {/* Conditional Main Title: Hidden on product pages so it doesn't duplicate the product name */}
          {!product && (
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight capitalize mt-1">
              {title}
            </h1>
          )}

        </motion.div>
      </div>
    </section>
  );
};

export default PageHero;