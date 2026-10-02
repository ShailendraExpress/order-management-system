import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { XIcon } from "@heroicons/react/solid";

import {
  FaShoppingBag,
  FaSearch,
  FaBars,
  FaUser,
  FaBox,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

import NavCartButton from "../components/cart/NavCartButton";
import { logout } from "../store/actions/auth-actions"; // Admin Logout
import { authActions } from "../store/auth-slice"; // Customer Logout

const MainNavigation = () => {
  const [showNav, setShowNav] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Ref for click-outside logic
  const dropdownRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

const handleAdminLogout = () => {
      // 1. Redux aur LocalStorage dono ek sath completely saaf
      dispatch(authActions.globalLogout()); 
      
      // 2. Turant Login page par phek dega aur memory fresh kar dega
      navigate('/login', { replace: true }); 
  };
const handleSecureLogout = () => {
    // 1. Redux aur LocalStorage dono ek sath saaf
    dispatch(authActions.globalLogout()); 
    
    // 2. Turant Login page par bhejein
    navigate('/login', { replace: true }); 
};
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const token = useSelector((state) => state.auth.token);
  const isCustomerAuth = useSelector((state) => state.auth.isCustomerAuthenticated);
  const customer = useSelector((state) => state.auth.customer);

  // CLICK OUTSIDE LOGIC
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navHandler = () => setShowNav(!showNav);

  const logoutAdmin = () => dispatch(logout(token));

 const logoutCustomer = () => {
    // 1. Dropdown band karein
    setIsDropdownOpen(false);
    
    // 2. Naya Master Logout call karein (Redux aur LocalStorage dono saaf)
    dispatch(authActions.globalLogout());
    
    // 3. Turant Login page par bhejein
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm font-sans">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between gap-4 lg:gap-8">
          
          {/* 1. Left: Logo & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-700 hover:text-blue-600 transition-colors" onClick={navHandler}>
              {showNav ? <XIcon className="w-7 h-7" /> : <FaBars className="text-[1.4rem]" />}
            </button>

            <NavLink to="/" className="flex items-center gap-2 outline-none group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors">
                <FaShoppingBag className="text-lg" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                <span className="text-gray-900">My</span>
                <span className="text-blue-600">SHOP</span>
              </h1>
            </NavLink>
          </div>

          {/* 2. Middle: Desktop Links & Prominent Search Bar */}
          <div className="hidden lg:flex flex-1 items-center justify-between pl-4">
            {/* Desktop Navigation Links */}
            <nav className="flex items-center gap-6 xl:gap-8">
              {["Home", "Products", "About"].map((item) => (
                <NavLink 
                  key={item} 
                  to={item === "Home" ? "/" : `/${item.toLowerCase()}`} 
                  className={({ isActive }) => 
                    `text-sm font-bold transition-colors ${isActive ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`
                  }
                >
                  {item}
                </NavLink>
              ))}
            </nav>

            {/* Amazon/Flipkart Style Wide Search Bar */}
            <div className="relative flex-1 max-w-lg mx-6 group">
              <input 
                type="text" 
                placeholder="Search for products, brands and more..." 
                className="w-full pl-4 pr-12 py-2.5 rounded-md border border-gray-300 bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
              />
              <button className="absolute right-0 top-0 h-full px-4 text-gray-400 group-focus-within:text-blue-600 hover:text-blue-600 transition-colors">
                <FaSearch />
              </button>
            </div>
          </div>

          {/* 3. Right: Cart & Auth/Profile Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            
            {/* HAMESHA DIKHNE WALA CART ICON */}
            <div className="pt-1">
              <NavCartButton />
            </div>

            {/* Profile Dropdown OR Auth Buttons */}
            {isCustomerAuth ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm sm:text-base border-2 border-transparent hover:border-blue-500 transition-all shadow-sm focus:outline-none"
                >
                  {customer?.name?.charAt(0).toUpperCase()}
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-12 sm:top-14 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-100 mb-1 bg-gray-50/50 rounded-t-lg">
                        <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">Signed in as</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{customer?.name}</p>
                      </div>
                      
                      <Link to="/my-profile" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                        <FaUser className="text-gray-400" size={14}/> Profile
                      </Link>
                      <Link to="/my-orders" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                        <FaBox className="text-gray-400" size={14}/> Orders
                      </Link>
                      <Link to="/settings" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                        <FaCog className="text-gray-400" size={14}/> Settings
                      </Link>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button 
                        onClick={logoutCustomer} 
                        className="flex items-center gap-3 px-4 py-2 w-full hover:bg-red-50 text-sm font-medium text-red-600 transition-colors text-left"
                      >
                        <FaSignOutAlt size={14}/> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                 {/* Guest Actions */}
                 {!isAuthenticated && (
                  <>
                    <NavLink to="/login" className="hidden sm:block px-4 py-2 rounded-md text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                      Log in
                    </NavLink>
                    <NavLink to="/register" className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors">
                      Sign up
                    </NavLink>
                  </>
                 )}
                 {/* Admin Actions */}
                 {isAuthenticated && (
                   <button 
                    onClick={logoutAdmin} 
                    className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-sm transition-colors"
                   >
                     Admin Logout
                   </button>
                 )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default MainNavigation;