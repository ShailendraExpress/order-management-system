import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// Icon Imports
import {
  AiFillDashboard,
  AiOutlineShoppingCart,
  AiOutlineUser,
  AiOutlineSetting,
} from "react-icons/ai";
import {
  MdInventory,
  MdOutlineAddBox,
  MdOutlineCategory,
  MdOutlineLocalShipping,
  MdOutlineBrandingWatermark,
  MdOutlineKeyboardReturn,
  MdOutlineRateReview,
} from "react-icons/md";
import {
  FiLogOut,
  FiCreditCard,
  FiRepeat,
  FiTrendingUp,
  FiDollarSign,
  FiFileText,
  FiUsers,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { BsBoxSeam, BsTicketPerforated } from "react-icons/bs";
import { RiMegaphoneLine } from "react-icons/ri";

import { logout } from "../../store/actions/auth-actions";

// NAVIGATION MENU MAPPED WITH EXACT GRANULAR PERMISSIONS
const NAVIGATION_MENU = [
  {
    heading: "CORE",
    items: [
      {
        path: "/admin/dashboard",
        name: "Dashboard",
        icon: <AiFillDashboard aria-hidden="true" />,
        requiredPermission: null,
      },
    ],
  },
  {
    heading: "INVENTORY",
    items: [
      {
        path: "/admin/dashboard/products",
        name: "All Products",
        icon: <BsBoxSeam aria-hidden="true" />,
        requiredPermission: "inventory_all_products",
      },
      {
        path: "/admin/dashboard/addproduct",
        name: "Add Product",
        icon: <MdOutlineAddBox aria-hidden="true" />,
        requiredPermission: "inventory_add_product",
      },
      {
        path: "/admin/dashboard/categories",
        name: "Categories",
        icon: <MdOutlineCategory aria-hidden="true" />,
        requiredPermission: "inventory_categories",
      },
      {
        path: "/admin/dashboard/brands",
        name: "Brands",
        icon: <MdOutlineBrandingWatermark aria-hidden="true" />,
        requiredPermission: "inventory_brands",
      },
      {
        path: "/admin/dashboard/inventory",
        name: "Stock Audit",
        icon: <MdInventory aria-hidden="true" />,
        requiredPermission: "inventory_stock_audit",
      },
    ],
  },
  {
    heading: "ORDER MANAGEMENT",
    items: [
      {
        path: "/admin/dashboard/orders",
        name: "All Orders",
        icon: <AiOutlineShoppingCart aria-hidden="true" />,
        requiredPermission: "orders_all_orders",
      },
      {
        path: "/admin/dashboard/orders/returns",
        name: "Returns & RMA",
        icon: <MdOutlineKeyboardReturn aria-hidden="true" />,
        requiredPermission: "orders_returns_rma",
      },
    ],
  },
  {
    heading: "CUSTOMERS & PAYMENTS",
    items: [
      {
        path: "/admin/dashboard/allcustomers",
        name: "Customer List",
        icon: <AiOutlineUser aria-hidden="true" />,
        requiredPermission: "customers_list",
      },
      {
        path: "/admin/dashboard/customers/customerreviews",
        name: "Reviews",
        icon: <MdOutlineRateReview aria-hidden="true" />,
        requiredPermission: "customers_reviews",
      },
      {
        path: "/admin/dashboard/payments/transactions",
        name: "Transactions",
        icon: <FiCreditCard aria-hidden="true" />,
        requiredPermission: "customers_transactions",
      },
      {
        path: "/admin/dashboard/payments/refunds",
        name: "Refunds",
        icon: <FiRepeat aria-hidden="true" />,
        requiredPermission: "customers_refunds",
      },
    ],
  },
  {
    heading: "LOGISTICS & ANALYTICS",
    items: [
      {
        path: "/admin/dashboard/shipping/shipmentmanagement",
        name: "Shipments",
        icon: <MdOutlineLocalShipping aria-hidden="true" />,
        requiredPermission: "logistics_shipments",
      },
      {
        path: "/admin/dashboard/analytics/sales",
        name: "Sales Analytics",
        icon: <FiTrendingUp aria-hidden="true" />,
        requiredPermission: "logistics_sales_analytics",
      },
      {
        path: "/admin/dashboard/analytics/revenue",
        name: "Revenue Reports",
        icon: <FiDollarSign aria-hidden="true" />,
        requiredPermission: "logistics_revenue_reports",
      },
    ],
  },
  {
    heading: "SYSTEM",
    items: [
      {
        path: "/admin/dashboard/coupons",
        name: "Coupons",
        icon: <BsTicketPerforated aria-hidden="true" />,
        requiredPermission: "system_coupons",
      },
      {
        path: "/admin/dashboard/marketing",
        name: "Marketing Campaigns",
        icon: <RiMegaphoneLine aria-hidden="true" />,
        requiredPermission: "system_marketing_campaigns",
      },
      {
        path: "/admin/dashboard/invoices",
        name: "Tax Invoices",
        icon: <FiFileText aria-hidden="true" />,
        requiredPermission: "system_tax_invoices",
      },
      {
        path: "/admin/dashboard/staffusers",
        name: "Staff Users",
        icon: <FiUsers aria-hidden="true" />,
        requiredPermission: "system_staff_users",
      },
      {
        path: "/admin/dashboard/storesetting",
        name: "Store Settings",
        icon: <AiOutlineSetting aria-hidden="true" />,
        requiredPermission: "system_store_settings",
      },
    ],
  },
];

const TheSidebar = ({ isCollapsed }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  
  const authState = useSelector((state) => state.auth);
  const token = authState?.token;
  const user = authState?.user || authState?.admin || {};
  
  // Extract user role and permissions safely
  const currentUserRole = useMemo(() => {
    let extractedRole = "super_admin";
    if (user?.role && typeof user.role === 'string') {
      extractedRole = user.role;
    } else if (user?.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      extractedRole = typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].name;
    }
    return extractedRole.toLowerCase().replace(/ /g, "_");
  }, [user]);

  const isSuperAdmin = useMemo(() => {
    return currentUserRole.includes('super') || currentUserRole.includes('admin') || (user?.email || '').toLowerCase() === 'admin@myshop.com';
  }, [currentUserRole, user]);

  const userPermissions = useMemo(() => {
    if (Array.isArray(user?.permissions)) {
      return user.permissions.map(p => typeof p === 'string' ? p : p.name);
    }
    return [];
  }, [user]);

  const navRef = useRef(null);
  const [menuSearch, setMenuSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const handleScroll = () => {
      sessionStorage.setItem('sidebar_scroll_pos', navElement.scrollTop);
    };

    navElement.addEventListener('scroll', handleScroll);

    const savedScroll = sessionStorage.getItem('sidebar_scroll_pos');
    if (savedScroll) {
      navElement.scrollTop = parseInt(savedScroll, 10);
    }

    return () => {
      navElement.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  const handleLogout = useCallback(async () => {
    try {
      if (token) {
        await dispatch(logout(token));
      }
    } catch (error) {
      console.error("Failed to log out user:", error);
    }
  }, [dispatch, token]);

  // Filter menu based on precise granular permissions
  const filteredMenu = useMemo(() => {
    const permissionFilteredMenu = NAVIGATION_MENU.map(section => {
      const allowedItems = section.items.filter(item => {
        if (isSuperAdmin) return true;
        if (!item.requiredPermission) return true; // e.g. Dashboard
        return userPermissions.includes(item.requiredPermission);
      });
      return {
        ...section,
        items: allowedItems
      };
    }).filter(section => section.items.length > 0);

    if (!menuSearch.trim()) return permissionFilteredMenu;

    const query = menuSearch.toLowerCase();
    return permissionFilteredMenu.map(section => {
      const matchingItems = section.items.filter(item => 
        item.name.toLowerCase().includes(query)
      );
      return {
        ...section,
        items: matchingItems
      };
    }).filter(section => section.items.length > 0);

  }, [menuSearch, userPermissions, isSuperAdmin]);

  const userName = user.name || user.full_name || "Shailendra Singh";
  const userEmail = user.email || "admin@myshop.com";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside
      aria-label="Admin Sidebar Navigation"
      className="flex flex-col justify-between h-screen w-full bg-[#0B1120] text-slate-300 border-r border-slate-800/80 shadow-2xl select-none font-sans flex-shrink-0 transition-all duration-300 relative"
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="h-20 px-5 border-b border-slate-800/80 flex items-center justify-between bg-[#0B1120] flex-shrink-0">
          {!isCollapsed && (
            <div className="flex flex-col justify-center transition-opacity duration-200">
              <h1 className="text-xl font-black tracking-wide text-white leading-tight">
                My<span className="text-blue-500 font-black">Shop</span>
              </h1>
              <span className="text-[11px] text-slate-400 font-bold tracking-widest mt-0.5 leading-none">
                SELLER CENTRAL
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1 flex-shrink-0">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search menu..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-800/80 border border-slate-700/80 rounded-md text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-slate-600 focus:bg-slate-800 transition-all"
              />
              {menuSearch && (
                <button
                  type="button"
                  onClick={() => setMenuSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <FiX size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto px-2 py-3 space-y-4 custom-scrollbar"
          aria-label="Sidebar Menu"
        >
          {filteredMenu.length > 0 ? (
            filteredMenu.map((section) => (
              <div key={section.heading} className="space-y-1">
                {!isCollapsed && (
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-0.5">
                    {section.heading}
                  </h2>
                )}

                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          title={isCollapsed ? item.name : undefined}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex items-center gap-3 px-3 py-2 text-[13px] transition-all duration-150 ${
                            isCollapsed ? "justify-center px-0" : ""
                          } ${
                            isActive
                              ? "bg-slate-800/90 text-white font-semibold border-l-2 border-blue-500 rounded-none shadow-none"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-normal rounded-md"
                          }`}
                        >
                          <span className={`text-lg flex-shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`}>
                            {item.icon}
                          </span>
                          {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-xs text-slate-500 italic">
              No access or menu item found
            </div>
          )}
        </nav>
      </div>

      <div className="p-3 border-t border-slate-800/80 bg-[#070B14] flex-shrink-0 relative">
        {showUserMenu && !isCollapsed && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
            <div className="px-3 py-2 border-b border-slate-800 mb-1">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
              <p className="text-[10px] text-blue-400 capitalize mt-1 border-t border-slate-700/50 pt-1">Role: {currentUserRole.replace(/_/g, ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              type="button"
              className="w-full py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <FiLogOut size={14} />
              <span>Sign Out Securely</span>
            </button>
          </div>
        )}

        {isCollapsed ? (
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              type="button"
              title={`Signed in as ${userName} (Click to Sign Out)`}
              className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors cursor-pointer"
            >
              {userInitial}
            </button>
          </div>
        ) : (
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-white font-extrabold flex items-center justify-center text-xs tracking-wider shadow-sm shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">{userName}</p>
                <p className="text-[10px] text-slate-400 truncate capitalize">{currentUserRole.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              title="Sign Out"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600/20 transition-all shrink-0 cursor-pointer"
            >
              <FiLogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default React.memo(TheSidebar);