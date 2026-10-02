import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { authActions } from '../../store/auth-slice';
import { useNavigate } from 'react-router-dom'; 
import toast from 'react-hot-toast';

// Icons
import { BiLogOut } from 'react-icons/bi';
import { 
  FiSearch, FiBell, FiCommand, 
  FiX, FiMenu, FiShield, FiClock, FiCalendar,
  FiShoppingBag, FiUsers, FiBox, FiCreditCard 
} from 'react-icons/fi';
import { logout } from '../../store/actions/auth-actions';
import api from '../../utils/api'; 

const DashboardNavbar = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); 
  
  const token = useSelector((state) => state.auth?.token);
  const user = useSelector((state) => state.auth?.user);

  // Safely extract and format user role inside the component
  const userRole = useMemo(() => {
    let extractedRole = "Administrator";
    if (user?.role && typeof user.role === 'string') {
      extractedRole = user.role;
    } else if (user?.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      extractedRole = typeof user.roles[0] === 'string' ? user.roles[0] : (user.roles[0].name || "Administrator");
    }
    return extractedRole.replace(/_/g, ' ').toUpperCase();
  }, [user]);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false); 
  
  const [sessionTime, setSessionTime] = useState(0);

  // Global Search States
  const [searchQuery, setSearchQuery] = useState('');
  const emptySearchResults = { transactions: [], orders: [], customers: [], products: [], categories: [] };
  const [searchResults, setSearchResults] = useState(emptySearchResults);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const searchRequestRef = useRef(null);
  const searchCacheRef = useRef(new Map());

  const notifRef = useRef(null);
  const panelRef = useRef(null);
  const searchContainerRef = useRef(null);

  const audioContextRef = useRef(null);
  const seenNotificationIdsRef = useRef(null);

  useEffect(() => {
    const unlockAudio = () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioContextRef.current) audioContextRef.current = new AudioContextClass();
      if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume().catch(() => {});
    };
    document.addEventListener('pointerdown', unlockAudio);
    return () => document.removeEventListener('pointerdown', unlockAudio);
  }, []);

  const playNewOrderChime = useCallback(async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API is not supported.');
        return;
      }
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      const context = audioContextRef.current;
      if (context.state !== 'running') await context.resume();
      if (context.state !== 'running') {
        console.warn('Notification audio is not enabled. Click the admin page and try again.');
        return;
      }
      const now = context.currentTime;
      [{ frequency: 880, start: 0, duration: 0.16 }, { frequency: 1174.66, start: 0.18, duration: 0.25 }].forEach((tone) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(tone.frequency, now + tone.start);
        gain.gain.setValueAtTime(0.0001, now + tone.start);
        gain.gain.exponentialRampToValueAtTime(0.12, now + tone.start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + tone.start);
        oscillator.stop(now + tone.start + tone.duration + 0.02);
      });
      console.log('New order notification chime played.');
    } catch (error) {
      console.error('Could not play new order notification sound:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async (showLoader = false) => {
    if (showLoader) setNotifLoading(true);
    try {
      const response = await api.get('/api/v1/admin/notifications');
      const payload = response.data || {};
      const incoming = Array.isArray(payload.data) ? payload.data : [];
      const previousIds = seenNotificationIdsRef.current;
      if (previousIds === null) {
        seenNotificationIdsRef.current = new Set(incoming.map((item) => String(item.id)));
      } else {
        const newOrderArrived = incoming.some((item) => {
          const id = String(item.id);
          const type = String(item.type || '').toLowerCase();
          const title = String(item.title || '').toLowerCase();
          return !previousIds.has(id) && (
            type === 'new_order' ||
            type === 'order_created' ||
            title.includes('new order')
          );
        });
        if (newOrderArrived) playNewOrderChime();
        incoming.forEach((item) => previousIds.add(String(item.id)));
      }
      setNotifications(incoming);
      setUnreadCount(Number(payload.unread_count || 0));
    } catch (error) {
      console.error('Failed to load admin notifications:', error);
    } finally {
      if (showLoader) setNotifLoading(false);
    }
  }, [playNewOrderChime]);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(() => fetchNotifications(), 30000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read_at) {
        await api.patch(`/api/v1/admin/notifications/${notification.id}/read`);
        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id
              ? { ...item, read_at: new Date().toISOString() }
              : item
          )
        );
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }
      setIsNotifOpen(false);
      if (notification.url) navigate(notification.url);
    } catch (error) {
      toast.error('Could not mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/api/v1/admin/notifications/read-all');
      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          read_at: item.read_at || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch (error) {
      toast.error('Could not mark notifications as read.');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        if (!event.target.closest('#profile-trigger-btn')) {
          setIsSlidePanelOpen(false);
        }
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fast global search with cancellation of stale requests.
  const runGlobalSearch = useCallback(async (value) => {
    const query = String(value || '').trim();
    if (query.length < 2) {
      setSearchResults(emptySearchResults);
      setSearchedQuery('');
      setIsSearchOpen(false);
      setIsSearching(false);
      return emptySearchResults;
    }

    // Reuse recent exact-query results to make repeat searches feel instant.
    const cacheKey = query.toLowerCase();
    const cached = searchCacheRef.current.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      setSearchResults(cached.results);
      setSearchedQuery(query);
      setIsSearchOpen(true);
      setIsSearching(false);
      return cached.results;
    }
    if (cached) searchCacheRef.current.delete(cacheKey);

    if (searchRequestRef.current) searchRequestRef.current.abort();
    const controller = new AbortController();
    searchRequestRef.current = controller;
    setIsSearching(true);

    try {
      const response = await api.get(
        `/api/v1/global-search?query=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );
      if (controller.signal.aborted) return null;
      const responseData = response.data?.data || {};
      const results = { ...emptySearchResults, ...responseData };
      searchCacheRef.current.set(cacheKey, { results, expiresAt: Date.now() + 20000 });
      setSearchResults(results);
      setSearchedQuery(query);
      setIsSearchOpen(true);
      return results;
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Global search request failed:', error);
      }
      return null;
    } finally {
      if (searchRequestRef.current === controller) {
        searchRequestRef.current = null;
        setIsSearching(false);
      }
    }
  }, []);

  // Search after a short debounce; pasted text triggers the same onChange flow.
  useEffect(() => {
    const query = searchQuery.trim();
    if (searchRequestRef.current) {
      searchRequestRef.current.abort();
      searchRequestRef.current = null;
    }

    if (query.length < 2) {
      setSearchResults(emptySearchResults);
      setSearchedQuery('');
      setIsSearchOpen(false);
      setIsSearching(false);
      return undefined;
    }

    // Show the dropdown and loader immediately while the request is pending.
    setIsSearchOpen(true);
    setIsSearching(true);

    const timer = setTimeout(() => {
      runGlobalSearch(query);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (searchRequestRef.current) {
        searchRequestRef.current.abort();
        searchRequestRef.current = null;
      }
    };
  }, [searchQuery, runGlobalSearch]);

  const handleSelectSearchResult = (path) => {
    // Keep the last search term in the input; the clear button removes it.
    setIsSearchOpen(false);
    navigate(path);
  };

  const handleClearSearch = () => {
    if (searchRequestRef.current) {
      searchRequestRef.current.abort();
      searchRequestRef.current = null;
    }
    setSearchQuery('');
    setSearchResults(emptySearchResults);
    setSearchedQuery('');
    setIsSearching(false);
    setIsSearchOpen(false);
  };

  const getFirstResultPath = (results) => {
    if (results?.transactions?.length) {
      const txn = results.transactions[0];
      return `/admin/dashboard/payments/transactions/${txn.order_number || txn.order_id || txn.id}`;
    }
    if (results?.orders?.length) return `/admin/dashboard/orders/${results.orders[0].id}`;
    if (results?.customers?.length) return `/admin/dashboard/customers/${results.customers[0].id}`;
    if (results?.products?.length) return `/admin/dashboard/updateproducts/${results.products[0].id}`;
    if (results?.categories?.length) return '/admin/dashboard/categories';
    return null;
  };

  const handleSearchKeyDown = async (event) => {
    if (event.key === 'Escape') {
      setIsSearchOpen(false);
      return;
    }
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const query = searchQuery.trim();
    if (query.length < 2) return;

    let results = searchResults;
    if (searchedQuery !== query) {
      results = await runGlobalSearch(query);
    }
    if (!results) return;

    const path = getFirstResultPath(results) || matchingPages[0]?.path;
    if (path) handleSelectSearchResult(path);
  };

// Inside DashboardNavbar component:
const handleAdminLogout = useCallback(async () => {
  try {
    if (token) {
      await dispatch(logout(token));
    }
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    // Show a success message after logout.
    toast.success('You have been successfully logged out!');

    // Clear the global authentication state and redirect to the admin login page.
    dispatch(authActions.globalLogout()); 
    navigate('/admin', { replace: true }); 
  }
}, [dispatch, token, navigate]);

  const userName = user?.name || 'Administrator';
  const userEmail = user?.email || 'admin@myshop.com';
  const userInitial = userName.charAt(0).toUpperCase();

  const pageSearchItems = [
    { label: 'Dashboard', keywords: 'home overview', path: '/admin/dashboard' },
    { label: 'All Products', keywords: 'products inventory product list', path: '/admin/dashboard/products' },
    { label: 'Add Product', keywords: 'new product create', path: '/admin/dashboard/addproduct' },
    { label: 'Categories', keywords: 'category inventory', path: '/admin/dashboard/categories' },
    { label: 'Brands', keywords: 'brand inventory', path: '/admin/dashboard/brands' },
    { label: 'Stock Audit', keywords: 'stock inventory audit', path: '/admin/dashboard/inventory' },
    { label: 'All Orders', keywords: 'orders order management', path: '/admin/dashboard/orders' },
    { label: 'Returns & RMA', keywords: 'returns refund rma', path: '/admin/dashboard/orders/returns' },
    { label: 'Customer Management', keywords: 'customers customer users customer list', path: '/admin/dashboard/allcustomers' },
    { label: 'Reviews', keywords: 'reviews ratings', path: '/admin/dashboard/customers/customerreviews' },
    { label: 'Transactions', keywords: 'transactions payments payment', path: '/admin/dashboard/payments/transactions' },
    { label: 'Refunds', keywords: 'refunds payment', path: '/admin/dashboard/payments/refunds' },
    { label: 'Shipments', keywords: 'shipment shipping logistics', path: '/admin/dashboard/shipping/shipmentmanagement' },
    { label: 'Sales Analytics', keywords: 'sales analytics chart', path: '/admin/dashboard/analytics/sales' },
    { label: 'Revenue Reports', keywords: 'revenue reports income', path: '/admin/dashboard/analytics/revenue' },
    { label: 'Coupons', keywords: 'coupon discount promo', path: '/admin/dashboard/coupons' },
    { label: 'Marketing Campaigns', keywords: 'marketing campaigns promotion', path: '/admin/dashboard/marketing' },
    { label: 'Tax Invoices', keywords: 'tax invoice billing', path: '/admin/dashboard/invoices' },
    { label: 'Staff Users', keywords: 'staff users admin team', path: '/admin/dashboard/staffusers' },
    { label: 'Store Settings', keywords: 'store settings configuration', path: '/admin/dashboard/storesetting' },
  ];
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const matchingPages = normalizedSearch.length >= 2 ? pageSearchItems.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(normalizedSearch)).slice(0, 6) : [];
  const totalResultsCount = (searchResults.transactions?.length || 0) + (searchResults.orders?.length || 0) + (searchResults.customers?.length || 0) + (searchResults.products?.length || 0) + (searchResults.categories?.length || 0) + matchingPages.length;

  return (
    <header className="sticky top-0 z-50 w-full bg-white text-slate-800 border-b border-slate-200/80 px-4 sm:px-6 h-16 flex items-center justify-between select-none shadow-2xs flex-shrink-0 flex-nowrap">
      
      {/* LEFT: HAMBURGER SIDEBAR TOGGLE & WORKSPACE PATH */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex-shrink-0"
          title="Toggle Navigation Sidebar"
        >
          <FiMenu className="text-xl" />
        </button>
        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 hidden md:inline-block">
          Workspace / <span className="text-slate-900">Dashboard</span>
        </span>
      </div>

      {/* CENTER: LIVE GLOBAL SEARCH BAR INPUT & SUGGESTIONS */}
      <div className="flex-1 max-w-lg mx-4 hidden md:block relative" ref={searchContainerRef}>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
            {isSearching ? (
              <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" aria-label="Searching" />
            ) : (
              <FiSearch className="text-base" aria-hidden="true" />
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => { if (searchQuery.length >= 2) setIsSearchOpen(true); }}
            placeholder="Search pages, orders, customers, products, categories..."
            autoComplete="off"
            aria-label="Global search"
            className="w-full pl-10 pr-20 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-slate-900 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-150 shadow-2xs"
          />
          {searchQuery.trim() ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              title="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <FiX size={15} strokeWidth={2.5} />
            </button>
          ) : (
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 border border-slate-200 bg-white text-slate-500 text-[10px] font-mono font-semibold rounded shadow-2xs">
                <FiCommand className="text-[9px]" /> K
              </kbd>
            </div>
          )}
        </div>

        {/* LIVE SUGGESTIONS DROPDOWN */}
        {isSearchOpen && searchQuery.length >= 2 && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_12px_35px_rgba(15,23,42,0.14)] border border-slate-200/90 overflow-hidden z-50 max-h-[420px] overflow-y-auto animate-fade-in">
            {isSearching ? (
              <div className="flex min-h-[54px] items-center gap-3 px-4 py-3" role="status" aria-live="polite">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-700">Searching results</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">Looking for â€œ{searchQuery.trim()}â€</p>
                </div>
                <span className="text-[10px] font-medium text-slate-400">Please wait</span>
              </div>
            ) : totalResultsCount === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-medium">
                No matching results found for "<span className="font-bold text-slate-800">{searchQuery}</span>"
              </div>
            ) : (
              <div className="p-2 space-y-3">
                {/* Transactions Section */}
                {searchResults.transactions?.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 bg-slate-50 rounded-lg">
                      <FiCreditCard size={12} /> Transactions
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {searchResults.transactions.map(txn => (
                        <div 
                          key={txn.id}
                          onClick={() => handleSelectSearchResult(`/admin/dashboard/payments/transactions/${txn.order_number || txn.order_id || txn.id}`)}
                          className="px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 font-mono">{txn.transaction_id || txn.id}</p>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 font-mono">â‚¹{txn.amount || txn.total_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orders Section */}
                {searchResults.orders?.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 bg-slate-50 rounded-lg">
                      <FiShoppingBag size={12} /> Orders
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {searchResults.orders.map(order => (
                        <div 
                          key={order.id}
                          onClick={() => handleSelectSearchResult(`/admin/dashboard/orders/${order.id}`)}
                          className="px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 font-mono">{order.order_number}</p>
                            <p className="text-[11px] text-slate-500">Status: <span className="uppercase font-semibold text-slate-700">{order.status}</span></p>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 font-mono">â‚¹{order.total_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customers Section */}
                {searchResults.customers?.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 bg-slate-50 rounded-lg">
                      <FiUsers size={12} /> Customers
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {searchResults.customers.map(cust => (
                        <div 
                          key={cust.id}
                          onClick={() => handleSelectSearchResult(`/admin/dashboard/customers/${cust.id}`)}
                          className="px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{cust.name}</p>
                            <p className="text-[11px] text-slate-500">{cust.email}</p>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400">{cust.phone || 'No phone'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Section */}
                {searchResults.products?.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 bg-slate-50 rounded-lg">
                      <FiBox size={12} /> Products
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {searchResults.products.map(prod => (
                        <div 
                          key={prod.id}
                          onClick={() => handleSelectSearchResult(`/admin/dashboard/updateproducts/${prod.id}`)}
                          className="px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{prod.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">SKU: {prod.sku}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-800 font-mono">â‚¹{prod.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories Section */}
                {searchResults.categories?.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 bg-slate-50 rounded-lg">
                      <FiBox size={12} /> Categories
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {searchResults.categories.map(category => (
                        <button key={category.id} type="button" onClick={() => handleSelectSearchResult(`/admin/dashboard/categories${category.id ? `?category=${category.id}` : ''}`)} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between transition-colors">
                          <span className="text-xs font-bold text-slate-900">{category.name}</span>
                          <span className="text-[11px] text-slate-400">Category</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Pages / Menu Search */}
                {matchingPages.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 bg-slate-50 rounded-lg">
                      <FiMenu size={12} /> Pages & Menu
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {matchingPages.map(page => (
                        <button key={page.label} type="button" onClick={() => handleSelectSearchResult(page.path)} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between transition-colors">
                          <span className="text-xs font-semibold text-slate-900">{page.label}</span>
                          <span className="text-[11px] text-slate-400">Open page â†’</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: NOTIFICATIONS & PROFILE DRAWER TRIGGER */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        
        {/* NOTIFICATIONS DROPDOWN */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              const nextOpen = !isNotifOpen;
              setIsNotifOpen(nextOpen);
              if (nextOpen) fetchNotifications(true);
            }}
            className="relative p-2 sm:p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="View Notifications"
          >
            <FiBell className="text-lg" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
              >
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Notifications</h4>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                      {unreadCount} New
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {notifLoading && notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">Loading notifications...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">No notifications yet</div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                          notification.read_at ? 'bg-white' : 'bg-blue-50/60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                            notification.read_at ? 'bg-slate-300' : 'bg-blue-500'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800">
                              {notification.title || 'Notification'}
                            </p>
                            <p className="mt-1 text-xs text-slate-600 break-words">
                              {notification.message || ''}
                            </p>
                            {notification.created_at && (
                              <p className="mt-2 text-[10px] text-slate-400">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* PROFILE BUTTON TRIGGER */}
        <button 
          id="profile-trigger-btn"
          type="button"
          onClick={() => setIsSlidePanelOpen(!isSlidePanelOpen)}
          className="w-10 h-10 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-sm hover:scale-105 transition-transform cursor-pointer border-2 border-slate-100"
          title="Open Admin Profile"
        >
          {userInitial}
        </button>

        {/* RIGHT-SIDE SLIDING DRAWER PANEL */}
        <AnimatePresence>
          {isSlidePanelOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
              <motion.div
                ref={panelRef}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-sm bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between p-6 overflow-y-auto"
              >
                <div>
                  {/* Panel Header */}
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Admin Account</h3>
                    <button 
                      onClick={() => setIsSlidePanelOpen(false)}
                      className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <FiX size={18} />
                    </button>
                  </div>

                  {/* Dynamic Profile Card Section */}
                  <div className="flex items-center gap-4 py-5 border-b border-slate-100">
                    <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                      {userInitial}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{userName}</h4>
                        <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 text-[9px] font-bold uppercase border border-blue-100">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{userEmail}</p>
                    </div>
                  </div>

                  {/* Account Information Details: Role, Date & Live Timer */}
                  <div className="py-5 space-y-3 text-xs border-b border-slate-100">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold flex items-center gap-2"><FiShield size={15} /> Role:</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-extrabold uppercase text-[10px] tracking-wider border border-emerald-200">
                        {userRole}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold flex items-center gap-2"><FiCalendar size={15} /> Date:</span>
                      <span className="font-bold text-slate-800">{currentDate}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold flex items-center gap-2"><FiClock size={15} /> Session Time:</span>
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                        {formatTime(sessionTime)}
                      </span>
                    </div>
                  </div>

                  {/* Enterprise Feature Promotional Banner */}
                  <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-slate-800 shadow-xs relative overflow-hidden">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 mb-1">ðŸ”¥ Enterprise Feature</div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1">Boost Sales with AI Insights</h4>
                    <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">Optimize your warehouse inventory and automated pricing rules instantly.</p>
                    <button 
                      onClick={() => alert('AI Features coming soon!')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition-all shadow-sm cursor-pointer"
                    >
                      Explore AI Tools
                    </button>
                  </div>

                </div>

                {/* Logout Action Button at Bottom of Drawer */}
                <div className="pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSlidePanelOpen(false);
                      handleAdminLogout();
                    }}
                    className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-rose-200 shadow-2xs"
                  >
                    <BiLogOut size={16} /> Logout
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </header>
  );
};

export default React.memo(DashboardNavbar);

