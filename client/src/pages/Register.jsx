import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  FaUserAlt,
  FaGoogle,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";

import { register } from "../store/actions/auth-actions";
import TheSpinner from "../layout/TheSpinner";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: { opacity: 0, y: -20 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "tween", duration: 0.3, ease: "easeOut" } 
  },
};

const Register = () => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.ui.registerLoading);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRules = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/;

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },

    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .matches(passwordRules, {
          message: "Include uppercase, lowercase, and a number (min 5 chars).",
        })
        .required("Password is required"),
      password_confirmation: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Please confirm your password"),
    }),

    onSubmit: async (values) => {
      try {
        await dispatch(register(values));
      } catch (error) {
        console.log(error);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      <AnimatePresence mode="wait">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 shadow-xl"
        >
          {/* Header Section */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              Join <span className="font-bold text-blue-600">MyShop</span> for the best electronics deals.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <TheSpinner />
            </div>
          ) : (
            <form onSubmit={formik.handleSubmit} className="space-y-5">
              
              {/* Full Name */}
              <motion.div variants={itemVariants}>
                <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FaUserAlt className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.name}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                  />
                </div>
                {formik.touched.name && formik.errors.name && (
                  <p className="text-red-600 text-xs font-medium mt-1.5">
                    {formik.errors.name}
                  </p>
                )}
              </motion.div>

              {/* Email */}
              <motion.div variants={itemVariants}>
                <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MdEmail className="text-gray-400 text-lg group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.email}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                  />
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="text-red-600 text-xs font-medium mt-1.5">
                    {formik.errors.email}
                  </p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants}>
                <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <RiLockPasswordFill className="text-gray-400 text-lg group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none"
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-red-600 text-xs font-medium mt-1.5">
                    {formik.errors.password}
                  </p>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div variants={itemVariants}>
                <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <RiLockPasswordFill className="text-gray-400 text-lg group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="password_confirmation"
                    placeholder="••••••••"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password_confirmation}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
                {formik.touched.password_confirmation && formik.errors.password_confirmation && (
                  <p className="text-red-600 text-xs font-medium mt-1.5">
                    {formik.errors.password_confirmation}
                  </p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants} className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Create Account
                </button>
              </motion.div>

              {/* Divider */}
              <motion.div variants={itemVariants} className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">Or continue with</span>
                </div>
              </motion.div>

              {/* Google Button */}
              <motion.div variants={itemVariants}>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                >
                  <FaGoogle className="text-red-500 text-base" />
                  Sign up with Google
                </button>
              </motion.div>

            </form>
          )}

          {/* Footer Link */}
          <motion.div variants={itemVariants} className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </motion.div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Register;