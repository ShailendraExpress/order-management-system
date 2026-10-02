import React, { useState } from "react";
import { motion } from "framer-motion";

const TheContact = () => {
  const [emailInput, setEmailInput] = useState("");

  const inputHandler = (e) => {
    setEmailInput(e.target.value);
  };

  const submitForm = (e) => {
    e.preventDefault();
    // API logic or success message goes here
    console.log("Subscribed with: ", emailInput);
    setEmailInput("");
  };

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col lg:flex-row justify-between items-center gap-12"
        >
          {/* --- Left Side: Text Section --- */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
              Join our Newsletter And Get 20% OFF
            </h3>
            <p className="text-slate-500 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              Stay connected with the latest in technology, exclusive offers,
              and insider tips by subscribing to the MyShop newsletter!
            </p>
          </div>

          {/* --- Right Side: Form Section --- */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <form
              onSubmit={submitForm}
              className="w-full max-w-md flex shadow-[0_4px_20px_rgba(0,0,0,0.04)] rounded-lg overflow-hidden border border-slate-200 focus-within:border-[#2B4380] focus-within:ring-4 focus-within:ring-[#2B4380]/10 transition-all duration-300"
            >
              <input
                type="email"
                name="subscribe"
                id="subscribe"
                required
                onChange={inputHandler}
                value={emailInput}
                placeholder="Enter your email"
                className="flex-1 w-full px-6 py-4 sm:py-5 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white outline-none font-medium transition-colors"
              />
              <button
                type="submit"
                className="px-8 sm:px-10 py-4 sm:py-5 bg-[#2B4380] hover:bg-[#1e2f5c] text-white font-semibold tracking-wide transition-colors duration-300 border-none outline-none"
              >
                Subscribe
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TheContact;