// 1. Imported React hooks and routing components
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle, Store } from 'lucide-react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { authActions } from '../store/auth-slice'; 
import { toast } from 'react-toastify';

const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch(); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // 2. Redirect to dashboard if the admin is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  // 3. Handle secure admin authentication submission
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await axios.post('http://localhost:8000/api/login', {
          email: formData.email,
          password: formData.password
      });

      if(res.data.token) {
          // Persist token and user profile securely for layout and sidebar permissions
          const userData = res.data.user;
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('admin_data', JSON.stringify(userData));
          localStorage.setItem('user', JSON.stringify(userData)); // Added 'user' key so sidebar matches correctly
          
          // Dispatch login state to Redux store
          dispatch(authActions.adminLogin({ 
              token: res.data.token, 
              user: userData 
          }));

          setLoginSuccess(true);

          // Success notification
          toast.success("Welcome to Admin Panel");

          setTimeout(() => {
              // Redirect to dashboard cleanly without keeping login in browser history
              navigate('/admin/dashboard', { replace: true }); 
          }, 2000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid credentials. Please try again.";
      // Error notification toast
      toast.error(msg);
      setLoading(false);
    } 
  };

  return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center px-4 sm:px-6 pb-20 relative overflow-hidden">
        
        {/* --- PREMIUM SOFT BACKGROUND EFFECTS --- */}
        <div className="absolute top-0 w-full h-[40vh] bg-gradient-to-b from-gray-200/50 to-transparent pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gray-300/40 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-10 -left-32 w-80 h-80 bg-gray-300/40 rounded-full blur-[80px] pointer-events-none"></div>
        {/* --------------------------------------- */}

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[420px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-8 sm:p-10 relative z-10"
        >
          {loginSuccess ? (
            /* --- SUCCESS VIEW --- */
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 mb-8 w-full">
                <Store className="w-6 h-6 text-black" strokeWidth={2.5} />
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">MyShop</h1>
                <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-md ml-1">Admin</span>
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle className="text-black w-20 h-20 mb-5" strokeWidth={1.5} />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2 text-center">Access Granted</h2>
              
              <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
                Loading your dashboard securely...
              </p>
              
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6 overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="bg-black h-1.5 rounded-full absolute left-0 top-0"
                />
              </div>
            </div>
          ) : (
            /* --- LOGIN FORM VIEW --- */
            <>
              {/* BRAND HEADER */}
              <div className="flex flex-col items-center justify-center mb-8 w-full">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="bg-black text-white p-1.5 rounded-lg shadow-md">
                    <Store className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">MyShop</h1>
                  <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-widest rounded-md ml-1">
                    Admin
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Sign in to the admin dashboard</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                    </div>
                    <input 
                        type="email" 
                        placeholder="admin@myshop.com" 
                        className="block w-full pl-11 pr-4 py-3 text-sm text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl outline-none transition-all duration-200 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-1 focus:ring-black hover:bg-white" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        required
                    />
                  </div>
                </div>
                
                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                    </div>
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="block w-full pl-11 pr-11 py-3 text-sm text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl outline-none transition-all duration-200 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-1 focus:ring-black hover:bg-white" 
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        required
                    />
                    <button 
                        type="button" 
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-black transition-colors" 
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1" 
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                    disabled={loading || !formData.email || formData.password.length < 5} 
                    className="w-full mt-2 bg-black hover:bg-gray-800 text-white py-3.5 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center active:scale-[0.98] shadow-lg shadow-gray-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign In to Admin"
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
  );
};

export default AdminLogin;