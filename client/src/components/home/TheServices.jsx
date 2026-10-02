import React from "react";
import {
  FaLaptop,
  FaMobileAlt,
  FaHeadphones,
  FaGamepad,
  FaDesktop,
  FaCamera,
  FaArrowRight,
} from "react-icons/fa";
import { motion } from "framer-motion";

const services = [
  {
    icon: <FaLaptop size={28} />,
    title: "Laptops",
    desc: "Powerful laptops for work, study and gaming.",
    color: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
  },
  {
    icon: <FaMobileAlt size={28} />,
    title: "Smartphones",
    desc: "Latest Android & iPhone devices at best prices.",
    color: "from-indigo-500 to-purple-500",
    bg: "bg-indigo-50",
  },
  {
    icon: <FaHeadphones size={28} />,
    title: "Accessories",
    desc: "Premium accessories for your everyday needs.",
    color: "from-pink-500 to-rose-400",
    bg: "bg-pink-50",
  },
  {
    icon: <FaGamepad size={28} />,
    title: "Gaming",
    desc: "Gaming keyboards, mice and high-end consoles.",
    color: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50",
  },
  {
    icon: <FaDesktop size={28} />,
    title: "Monitors",
    desc: "High refresh rate monitors for professionals.",
    color: "from-orange-500 to-amber-400",
    bg: "bg-orange-50",
  },
  {
    icon: <FaCamera size={28} />,
    title: "Cameras",
    desc: "Capture your memories with premium cameras.",
    color: "from-violet-500 to-fuchsia-500",
    bg: "bg-violet-50",
  },
];

const TheServices = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
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
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="relative bg-white py-24 sm:py-32">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* --- Heading Section --- */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={headerVariants}
          className="flex flex-col items-center text-center mb-16 sm:mb-24"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-bold tracking-wider uppercase text-xs sm:text-sm mb-6 shadow-sm">
            Categories
          </span>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Shop By <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Category</span>
          </h2>

          <p className="text-lg text-slate-500 mt-6 max-w-2xl font-medium leading-relaxed">
            Explore thousands of premium electronic products from top brands around the world, curated just for you.
          </p>
        </motion.div>

        {/* --- Grid Section --- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8"
        >
          {services.map((item, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="group cursor-pointer bg-[#FAFCFF] border border-slate-100 rounded-[2rem] p-8 xl:p-10 transition-all duration-300 hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-2 relative overflow-hidden"
            >
              {/* Top Accent Line */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="flex items-start justify-between mb-8">
                {/* Icon Box */}
                <div className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                  {/* Hover Gradient Background for Icon Box */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <span className="text-slate-700 relative z-10 transition-colors duration-300 group-hover:text-white">
                    {item.icon}
                  </span>
                </div>

                {/* Arrow Icon that appears on hover */}
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <FaArrowRight size={14} />
                </div>
              </div>

              {/* Text Content */}
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors duration-300">
                {item.title}
              </h3>

              <p className="text-slate-500 font-medium leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default TheServices;