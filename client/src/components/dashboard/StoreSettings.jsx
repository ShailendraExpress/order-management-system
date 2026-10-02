import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiSettings, FiBriefcase, FiGlobe, FiShoppingBag,
  FiShare2, FiSave, FiCreditCard, FiTruck, FiVolume2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from '../../utils/api';

const StoreSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isInitialMount = useRef(true);

  // Default Store Settings State
  const [settings, setSettings] = useState({
    storeName: 'My Shop Seller Central',
    supportEmail: 'support@myshop.com',
    phone: '+91 9876543210',
    address: '123, E-commerce Business Park, New Delhi, India',
    
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    weightUnit: 'kg',

    orderPrefix: 'ORD-',
    minOrderValue: '500',
    taxIncluded: true,

    razorpayKey: '',
    razorpaySecret: '',
    codEnabled: true,
    
    deliveryCharge: '50',
    freeShippingThreshold: '999',

    facebookUrl: 'https://facebook.com/myshop',
    instagramUrl: 'https://instagram.com/myshop',
    twitterUrl: ''
  });

  // Securely fetch settings from the backend
  const fetchSettings = useCallback(async () => {
    let isMounted = true;
    
    if (isInitialMount.current) {
      setLoading(true);
    }
    
    try {
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }

      const response = await api.get('/api/v1/admin/settings');
      const responseData = response.data?.data || response.data;
      
      if (isMounted && responseData && Object.keys(responseData).length > 0) {
        setSettings((prev) => ({ ...prev, ...responseData }));
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      if (isMounted) {
        toast.error("Failed to load store settings from server.");
      }
    } finally {
      if (isMounted) {
        setLoading(false);
        isInitialMount.current = false;
      }
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle input changes dynamically for text, number, and checkboxes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Securely save settings to the backend
  const handleSaveSettings = async () => {
    const confirmResult = await Swal.fire({
      title: 'Save Changes?',
      text: "Are you sure you want to update the store settings?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669', // Emerald Green
      cancelButtonColor: '#94a3b8',  // Slate-400
      confirmButtonText: 'Yes, Save it!',
      customClass: {
        popup: 'rounded-2xl shadow-xl border border-slate-200',
        confirmButton: 'rounded-lg px-5 py-2.5 font-semibold tracking-wide',
        cancelButton: 'rounded-lg px-5 py-2.5 font-semibold tracking-wide'
      }
    });

    if (confirmResult.isConfirmed) {
      setSaving(true);
      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }

        await api.put('/api/v1/admin/settings', settings);
        
        Swal.fire({
          title: 'Saved!',
          text: 'Store settings have been updated successfully.',
          icon: 'success',
          confirmButtonColor: '#059669',
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-lg px-6 py-2.5 font-semibold'
          }
        });
      } catch (error) {
        console.error("Failed to save settings:", error);
        Swal.fire({
          title: 'Error!',
          text: error.response?.data?.message || 'Failed to save settings. Please try again.',
          icon: 'error',
          confirmButtonColor: '#e11d48',
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-lg px-6 py-2.5 font-semibold'
          }
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const playNewOrderChime = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      toast.error("Your browser does not support audio preview.");
      return;
    }
    let audioContext;
    try {
      audioContext = new AudioContextClass();
      await audioContext.resume();
      [880, 1174].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const startAt = audioContext.currentTime + index * 0.16;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startAt);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.linearRampToValueAtTime(0.12, startAt + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.42);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.45);
        if (index === 1) oscillator.onended = () => audioContext.close();
      });
    } catch (error) {
      if (audioContext && audioContext.state !== "closed") await audioContext.close();
      toast.error("Unable to play notification preview.");
      console.error("Notification sound preview failed:", error);
    }
  };
  const TABS = [
    { id: 'general', label: 'General Details', icon: <FiBriefcase size={16} />, desc: 'Basic store info & address' },
    { id: 'regional', label: 'Regional Settings', icon: <FiGlobe size={16} />, desc: 'Currency, timezone & units' },
    { id: 'checkout', label: 'Checkout & Orders', icon: <FiShoppingBag size={16} />, desc: 'Order formats & limits' },
    { id: 'payments', label: 'Payment Gateways', icon: <FiCreditCard size={16} />, desc: 'Razorpay & COD settings' },
    { id: 'shipping', label: 'Shipping Rules', icon: <FiTruck size={16} />, desc: 'Delivery & free shipping' },
    { id: 'social', label: 'Social Media', icon: <FiShare2 size={16} />, desc: 'Connect social accounts' },
  ];

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs shrink-0">
            <FiSettings className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Store Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage your core business preferences and configurations.</p>
          </div>
        </div>

        {/* SAVE SETTINGS BUTTON */}
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin"></span>
          ) : (
            <FiSave size={16} />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* MAIN SETTINGS LAYOUT */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* LEFT SIDEBAR - NAVIGATION TABS */}
        <div className="w-full md:w-72 shrink-0 space-y-2">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white border border-slate-200 shadow-sm'
                  : 'bg-transparent border border-transparent hover:bg-slate-200/50 text-slate-600'
              }`}
            >
              <div className={`mt-0.5 transition-colors ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-400'}`}>
                {tab.icon}
              </div>
              <div>
                <div className={`text-sm font-bold transition-colors ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-700'}`}>
                  {tab.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{tab.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* RIGHT CONTENT - FORM FIELDS */}
        <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 sm:p-8 relative min-h-[400px]">
          
          {/* LIGHT BLACK / SLATE LOADER OVERLAY */}
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl z-20">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin shadow-sm"></div>
              <p className="font-semibold text-xs tracking-wide text-slate-600 animate-pulse">Loading Settings...</p>
            </div>
          ) : null}

          {/* GENERAL DETAILS TAB */}
          <div className={`${activeTab === 'general' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <div>
              <h3 className="text-base font-bold text-slate-900">General Details</h3>
              <p className="text-xs text-slate-500 mt-1">This information appears on customer invoices and emails.</p>
            </div>
            <hr className="border-slate-100" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Store Name</label>
                <input type="text" name="storeName" value={settings.storeName} onChange={handleInputChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Support Email</label>
                <input type="email" name="supportEmail" value={settings.supportEmail} onChange={handleInputChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Support Phone</label>
                <input type="text" name="phone" value={settings.phone} onChange={handleInputChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Registered Business Address</label>
                <textarea name="address" rows="3" value={settings.address} onChange={handleInputChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all resize-none"></textarea>
              </div>
            </div>
          </div>

          {/* REGIONAL SETTINGS TAB */}
          <div className={`${activeTab === 'regional' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <div>
              <h3 className="text-base font-bold text-slate-900">Regional Settings</h3>
              <p className="text-xs text-slate-500 mt-1">Configure how money and measurements are displayed.</p>
            </div>
            <hr className="border-slate-100" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Store Currency</label>
                <select name="currency" value={settings.currency} onChange={handleInputChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-all appearance-none cursor-pointer">
                  <option value="INR">â‚¹ Indian Rupee (INR)</option>
                  <option value="USD">$ US Dollar (USD)</option>
                  <option value="EUR">â‚¬ Euro (EUR)</option>
                  <option value="GBP">Â£ British Pound (GBP)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Timezone</label>
                <select name="timezone" value={settings.timezone} onChange={handleInputChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-all appearance-none cursor-pointer">
                  <option value="Asia/Kolkata">(GMT+05:30) India Standard Time</option>
                  <option value="UTC">(GMT+00:00) UTC</option>
                  <option value="America/New_York">(GMT-05:00) Eastern Time</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Default Weight Unit</label>
                <select name="weightUnit" value={settings.weightUnit} onChange={handleInputChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-all appearance-none cursor-pointer">
                  <option value="kg">Kilograms (kg)</option>
                  <option value="gm">Grams (gm)</option>
                  <option value="lbs">Pounds (lbs)</option>
                </select>
              </div>
            </div>
          </div>

          {/* CHECKOUT & ORDERS TAB */}
          <div className={`${activeTab === 'checkout' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <div>
              <h3 className="text-base font-bold text-slate-900">Checkout & Orders</h3>
              <p className="text-xs text-slate-500 mt-1">Manage order rules and checkout behavior.</p>
            </div>
            <hr className="border-slate-100" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Order ID Prefix</label>
                <input type="text" name="orderPrefix" value={settings.orderPrefix} onChange={handleInputChange} placeholder="e.g. ORD-" className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all" />
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Orders will look like: <span className="font-mono text-slate-600">{settings.orderPrefix}1001</span></p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Min. Order Value ({settings.currency})</label>
                <input type="number" name="minOrderValue" value={settings.minOrderValue} onChange={handleInputChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all" />
              </div>
              
              <div className="md:col-span-2 flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50 mt-2 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">Include Tax in Prices</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">If enabled, product prices will be shown inclusive of GST/Taxes.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="taxIncluded" checked={settings.taxIncluded} onChange={handleInputChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            </div>
            <div className="mt-6 p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <FiVolume2 size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">New Order Notification Sound</div>
                  <div className="text-xs text-slate-500 mt-1">Preview a soft, professional two-tone chime for new orders.</div>
                  <div className="text-xs text-slate-600 mt-2 font-medium">Professional Chime</div>
                </div>
              </div>
              <button type="button" onClick={playNewOrderChime} className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0">
                <FiVolume2 size={16} /> Preview Sound
              </button>
            </div>
          </div>

          {/* PAYMENT SETTINGS TAB */}
          <div className={`${activeTab === 'payments' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <div>
              <h3 className="text-base font-bold text-slate-900">Payment Gateways</h3>
              <p className="text-xs text-slate-500 mt-1">Configure Razorpay API keys and offline payment methods.</p>
            </div>
            <hr className="border-slate-100" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Razorpay Key ID</label>
                <input type="text" name="razorpayKey" value={settings.razorpayKey} onChange={handleInputChange} placeholder="rzp_test_xxxxxx" className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all font-mono" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Razorpay Key Secret</label>
                <input type="password" name="razorpaySecret" value={settings.razorpaySecret} onChange={handleInputChange} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all font-mono" />
              </div>
              
              <div className="md:col-span-2 flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50 mt-2 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">Enable Cash on Delivery (COD)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Allow customers to pay with cash upon delivery.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="codEnabled" checked={settings.codEnabled} onChange={handleInputChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* SHIPPING RULES TAB */}
          <div className={`${activeTab === 'shipping' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <div>
              <h3 className="text-base font-bold text-slate-900">Shipping Rules</h3>
              <p className="text-xs text-slate-500 mt-1">Set delivery charges and free shipping logic.</p>
            </div>
            <hr className="border-slate-100" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Standard Delivery Charge ({settings.currency})</label>
                <input type="number" name="deliveryCharge" value={settings.deliveryCharge} onChange={handleInputChange} placeholder="50" className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Free Shipping Threshold ({settings.currency})</label>
                <input type="number" name="freeShippingThreshold" value={settings.freeShippingThreshold} onChange={handleInputChange} placeholder="999" className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all" />
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Orders above this amount will get free shipping.</p>
              </div>
            </div>
          </div>

          {/* SOCIAL MEDIA TAB */}
          <div className={`${activeTab === 'social' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <div>
              <h3 className="text-base font-bold text-slate-900">Social Media Links</h3>
              <p className="text-xs text-slate-500 mt-1">These links will be displayed in your store's footer.</p>
            </div>
            <hr className="border-slate-100" />
            
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Facebook Page URL</label>
                <input type="url" name="facebookUrl" value={settings.facebookUrl} onChange={handleInputChange} placeholder="https://facebook.com/..." className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Instagram Profile URL</label>
                <input type="url" name="instagramUrl" value={settings.instagramUrl} onChange={handleInputChange} placeholder="https://instagram.com/..." className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Twitter/X URL</label>
                <input type="url" name="twitterUrl" value={settings.twitterUrl} onChange={handleInputChange} placeholder="https://twitter.com/..." className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StoreSettings;
