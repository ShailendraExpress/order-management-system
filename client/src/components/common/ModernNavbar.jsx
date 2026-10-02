import React from "react";
import { NavLink } from "react-router-dom";

const ModernNavbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* Logo */}
        <NavLink to="/" className="text-3xl font-bold">
          <span className="text-blue-600">Future</span>
          <span className="text-amber-500">Shop</span>
        </NavLink>

        {/* Menu */}
        <nav className="hidden md:flex gap-8 font-medium">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <NavLink
            to="/login"
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Login
          </NavLink>
        </div>

      </div>
    </header>
  );
};

export default ModernNavbar;