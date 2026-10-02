import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaSearch, FaShoppingCart, FaStar, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { formatPrice } from "../../utils/helpers";

const FeaturedProducts = () => {
  const products = useSelector((state) => state.products.products);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 60, damping: 15 },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="relative bg-[#FAFCFF] py-24 sm:py-32 overflow-hidden">
      
      {/* Subtle Ambient Background Blob */}
      <div className="absolute top-[20%] right-[-5%] w-[40rem] h-[40rem] bg-blue-100/30 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* --- Heading Section --- */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={headerVariants}
          className="flex flex-col items-center text-center mb-16 sm:mb-24"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold tracking-wider uppercase text-xs sm:text-sm mb-6 shadow-sm">
            Featured Collection
          </span>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Trending <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Products</span>
          </h2>

          <p className="text-lg text-slate-500 mt-6 max-w-2xl font-medium leading-relaxed">
            Discover our latest premium products with unbeatable prices,
            fast delivery, and trusted quality.
          </p>
        </motion.div>

        {/* --- Product Cards Grid --- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10"
        >
          {products.slice(0, 6).map((product) => (
            <motion.div
              key={product.id}
              variants={cardVariants}
              className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.1)] transition-all duration-500 hover:-translate-y-2"
            >
              
              {/* Image Container */}
              <div className="relative bg-slate-50 h-72 sm:h-80 flex justify-center items-center overflow-hidden p-8">
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-110 drop-shadow-sm"
                />

                {/* Badges */}
                <span className="absolute top-5 left-5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] sm:text-xs px-3.5 py-1.5 rounded-full font-bold tracking-widest shadow-md">
                  SALE
                </span>

                {/* Glassmorphic Hover Overlay */}
                <Link
                  to={`/products/${product.id}`}
                  className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 z-10"
                >
                  <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 text-blue-600 hover:bg-blue-600 hover:text-white">
                    <FaSearch className="text-xl" />
                  </div>
                </Link>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-8 flex flex-col flex-grow">
                
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <span className="text-blue-600 font-black text-lg sm:text-xl shrink-0">
                    {formatPrice(product.price)}
                  </span>
                </div>

                <div className="flex items-center mb-6">
                  <div className="flex text-amber-400 text-sm">
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                  </div>
                  <span className="ml-2 text-slate-400 font-medium text-sm">
                    (4.9)
                  </span>
                </div>

                {/* Add to Cart Button */}
                <div className="mt-auto pt-2">
                  <button className="w-full bg-slate-900 hover:bg-blue-600 text-white py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)]">
                    <FaShoppingCart className="text-sm" />
                    <span>Add To Cart</span>
                  </button>
                </div>

              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* --- View All Button --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-16 sm:mt-20"
        >
          <Link
            to="/products"
            className="group relative inline-flex items-center gap-3 bg-white border-2 border-slate-200 text-slate-800 hover:border-blue-600 hover:text-blue-600 px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-sm hover:shadow-lg active:scale-95"
          >
            <span>View All Products</span>
            <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
};

export default FeaturedProducts;