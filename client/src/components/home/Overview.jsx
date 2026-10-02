import React from "react";
import { FaTruck, FaShieldAlt, FaUndoAlt, FaHeadset } from "react-icons/fa";
import { motion } from "framer-motion";

const features = [
  {
    icon: <FaTruck size={24} />,
    title: "Free Shipping",
    text: "Fast and free delivery on eligible orders across India.",
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50",
    textHover: "group-hover:text-blue-600"
  },
  {
    icon: <FaShieldAlt size={24} />,
    title: "Secure Payment",
    text: "100% secure payment with trusted payment gateways.",
    color: "from-emerald-400 to-teal-500",
    bg: "bg-emerald-50",
    textHover: "group-hover:text-emerald-600"
  },
  {
    icon: <FaUndoAlt size={24} />,
    title: "Easy Returns",
    text: "7-day hassle-free return policy on selected products.",
    color: "from-orange-400 to-red-500",
    bg: "bg-orange-50",
    textHover: "group-hover:text-orange-600"
  },
  {
    icon: <FaHeadset size={24} />,
    title: "24/7 Support",
    text: "Friendly customer support whenever you need help.",
    color: "from-violet-500 to-purple-500",
    bg: "bg-violet-50",
    textHover: "group-hover:text-violet-600"
  },
];

const Overview = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 60, damping: 15 },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="relative bg-[#FAFCFF] py-24 sm:py-32 overflow-hidden">
      
      {/* Subtle Ambient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[20rem] bg-blue-100/40 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* --- Heading Section --- */}
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={headerVariants}
          className="text-center max-w-3xl mx-auto mb-16 sm:mb-24"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold tracking-wider uppercase text-xs sm:text-sm mb-6 shadow-sm">
            Why Choose Us
          </span>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Experience Shopping <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              The Better Way
            </span>
          </h2>
          
          <p className="text-lg text-slate-500 mt-6 leading-relaxed font-medium">
            MyShop brings together premium technology products,
            trusted brands, secure payments, and lightning-fast delivery
            to give you the absolute best online shopping experience.
          </p>
        </motion.div>

        {/* --- Cards Grid --- */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8"
        >
          {features.map((item, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="group relative bg-white rounded-[2rem] p-8 lg:p-10 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.1)] transition-all duration-300 hover:-translate-y-2 overflow-hidden"
            >
              {/* Decorative top gradient border on hover */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Icon Container */}
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${item.bg} text-slate-700 flex items-center justify-center mb-6 sm:mb-8 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md relative z-10`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                <span className={`transition-colors duration-300 ${item.textHover}`}>
                  {item.icon}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                {item.title}
              </h3>
              
              <p className="text-slate-500 leading-relaxed font-medium text-sm sm:text-base">
                {item.text}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default Overview;