import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AnimatePresence } from "framer-motion";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Action Imports
import { getProducts } from "./store/actions/products-actions";

// Layout & Guards
import MainNavigation from "./layout/MainNavigation";
import Footer from "./layout/Footer";
import { ProtectedRoute, UnauthenticatedRoute } from "./components/auth/ProtectedRoute";

// --- PAGES ---
// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import NotFound from './pages/NotFound';

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from './pages/AdminLogin';

// Customer Private Pages
import CustomerOrders from './pages/CustomerOrders';
import CustomerOrderDetails from './pages/CustomerOrderDetails';
import MyProfile from './pages/MyProfile';

// Admin Dashboard Components
import Dashboard from "./pages/dashboard/Dashboard";
import TheProducts from "./components/dashboard/TheProducts";
import AddProduct from "./components/dashboard/AddProduct";
import UpdateProducts from "./components/dashboard/UpdateProducts";
import ProductUpdate from "./components/dashboard/ProductUpdate";
import Categories from "./components/dashboard/Categories";
import Brands from "./components/dashboard/Brands";
import Inventory from "./components/dashboard/Inventory";
import Orders from "./components/dashboard/Orders";
import OrderDetails from "./components/dashboard/OrderDetails";
import Returns from "./components/dashboard/Returns";
import RMAProcess from "./components/dashboard/RMAProcess";
import AllCustomers from "./components/dashboard/AllCustomers";
import AddCustomer from "./components/dashboard/AddCustomer";
import EditCustomer from './components/dashboard/EditCustomer';
import CustomerDetails from './components/dashboard/CustomerDetails';
import CustomerReviews from "./components/dashboard/CustomerReviews";
import ShipmentManagement from "./components/dashboard/ShipmentManagement";
import CreateShipment from "./components/dashboard/CreateShipment";
import ShipmentDetails from "./components/dashboard/ShipmentDetails";
import CouponManagement from "./components/dashboard/CouponManagement";
import CreateCoupon from "./components/dashboard/CreateCoupon";
import EditCoupon from './components/dashboard/EditCoupon';
import Transactions from "./components/dashboard/Transactions";
import TransactionDetails from './components/dashboard/TransactionDetails';
import Refunds from "./components/dashboard/Refunds";

import SalesAnalytics from './components/dashboard/SalesAnalytics';
import RevenueReports from './components/dashboard/RevenueReports';
import StaffUsers from './components/dashboard/StaffUsers';
import StoreSettings from './components/dashboard/StoreSettings';
import TaxInvoices from './components/dashboard/TaxInvoices';
import MarketingCampaigns from './components/dashboard/MarketingCampaigns';

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  // Hide Main Navigation and Footer on all admin dashboard routes
  const isAdminRoute = location.pathname.includes('/admin');

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Render Main Navigation only on client-facing store pages */}
      {!isAdminRoute && <MainNavigation />}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* =========================================================
              PUBLIC STOREFRONT ROUTES 
          ========================================================== */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/order-success" element={<OrderSuccess />} />

          {/* =========================================================
              GUEST ONLY AUTHENTICATION ROUTES (Redirects if Logged In)
          ========================================================== */}
          <Route element={<UnauthenticatedRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route path="/admin" element={<AdminLogin />} />
          {/* =========================================================
              CUSTOMER PRIVATE PROTECTED ROUTES 
          ========================================================== */}
          <Route element={<ProtectedRoute allowedRole="customer" />}>
            <Route path="/my-orders" element={<CustomerOrders />} />
            <Route path="/my-orders/:orderId" element={<CustomerOrderDetails />} />
            <Route path="/my-profile" element={<MyProfile />} />
          </Route>
          <Route path="orders" element={<div className="p-20 text-4xl font-bold text-slate-900 bg-white w-full h-full">TESTING ORDERS PAGE</div>} />
          {/* =========================================================
              ADMIN DASHBOARD PROTECTED ROUTES & NESTED CHILDREN
          ========================================================== */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="/admin/dashboard" element={<Dashboard />}>

              {/* Products */}
              <Route path="products" element={<TheProducts />} />
              <Route path="addproduct" element={<AddProduct />} />
              <Route path="updateproducts" element={<UpdateProducts />} />
              <Route path="updateproducts/:productId" element={<ProductUpdate />} />

              {/* Catalog */}
              <Route path="categories" element={<Categories />} />
              <Route path="brands" element={<Brands />} />
              <Route path="inventory" element={<Inventory />} />

              {/* Orders */}
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:orderId" element={<OrderDetails />} />
              <Route path="orders/returns" element={<Returns />} />
              <Route path="returns/:rmaId" element={<RMAProcess />} />

              {/* Customers */}
              <Route path="allcustomers" element={<AllCustomers />} />
              <Route path="customers/addcustomer" element={<AddCustomer />} />
              <Route path="customers/customerreviews" element={<CustomerReviews />} />
              <Route path="customers/edit/:id" element={<EditCustomer />} />
              <Route path="customers/:id" element={<CustomerDetails />} />

              {/* Analytics */}
              <Route path="analytics/sales" element={<SalesAnalytics />} />
              <Route path="analytics/revenue" element={<RevenueReports />} />

              {/* Coupons */}
              <Route path="coupons" element={<CouponManagement />} />
              <Route path="coupons/create" element={<CreateCoupon />} />
              <Route path="coupons/edit/:id" element={<EditCoupon />} />

              {/* Shipping */}
              <Route
                path="shipping/shipmentmanagement"
                element={<ShipmentManagement />}
              />
              <Route path="shipping/create" element={<CreateShipment />} />
              <Route
                path="shipping/details/:shipId"
                element={<ShipmentDetails />}
              />

              {/* Payments */}
              <Route path="payments/refunds" element={<Refunds />} />
              <Route path="payments/transactions" element={<Transactions />} />
              <Route
                path="payments/transactions/:orderNumber"
                element={<TransactionDetails />}
              />

              {/* Other */}
              <Route path="staffusers" element={<StaffUsers />} />
              <Route path="storesetting" element={<StoreSettings />} />
              <Route path="marketing" element={<MarketingCampaigns />} />
              <Route path="invoices" element={<TaxInvoices />} />

            </Route>
          </Route>
          {/* =========================================================
              FALLBACK CATCH-ALL ROUTE 
          ========================================================== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>

      {/* Render Footer only on client-facing store pages */}
      {!isAdminRoute && <Footer />}
    </>
  );
};

export default App;