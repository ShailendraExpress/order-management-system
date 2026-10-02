import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import api, { getCsrfCookie } from '../utils/api';
import { authActions } from '../store/auth-slice';
import { Eye, EyeOff } from 'lucide-react';

// Imported react-toastify for clean alert notifications
import { toast } from 'react-toastify'; 

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginType, setLoginType] = useState('email');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', password_confirmation: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Check for logout message from session storage when component mounts
useEffect(() => {
    const logoutMessage = sessionStorage.getItem('logout_toast');
    if (logoutMessage) {
      toast.success(logoutMessage);
      sessionStorage.removeItem('logout_toast');
    }
  }, []);

  const isFormValid = isSignUp 
    ? (formData.name && formData.email.includes('@') && formData.password.length >= 6 && formData.password === formData.password_confirmation)
    : (formData.email.includes('@') && formData.password.length >= 6);

  const isButtonDisabled = loading || !termsAccepted || (loginType === 'email' ? !isFormValid : formData.phone.length !== 10);

  // Handle Authentication (Sign In / Register) securely
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await getCsrfCookie();
      const payload = isSignUp ? formData : { email: formData.email, password: formData.password };
      const res = await api.post(isSignUp ? '/api/customer/register' : '/api/customer/login', payload);
      handleLoginSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.errors ? Object.values(err.response.data.errors)[0][0] : (err.response?.data?.message || "Authentication Failed");
      toast.error(msg);
    } finally { setLoading(false); }
  };

  // Handle Google OAuth Authentication Success
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await api.post('/api/customer/auth/google', { token: credentialResponse.credential });
      handleLoginSuccess(res.data);
    } catch (error) { 
      toast.error("Google Login Failed"); 
    }
    finally { setLoading(false); }
  };

  // Handle Successful Login & Store User Profiles/Permissions locally for layout rendering
  const handleLoginSuccess = (data) => {
    toast.success(isSignUp ? "Account created successfully!" : "Login successful!");

    const userData = data.customer || data.user;

    localStorage.setItem('customer_token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    dispatch(authActions.customerLogin({ token: data.token, customer: userData }));
    
    navigate('/', { replace: true });
  };

  return (
    <GoogleOAuthProvider clientId="454202103503-s5h9rhlj6kp5fqi7gctve6165jr85ib5.apps.googleusercontent.com">
      <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10 px-4">
        <div className="text-2xl font-bold text-blue-600 mb-8">MySHOP</div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-[400px] bg-white rounded-2xl shadow-sm border p-8">
          
          <h2 className="text-xl font-bold text-center mb-6 text-gray-800">{isSignUp ? "Create an account" : "Welcome back"}</h2>

          {!isSignUp && (
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6 border">
              {['email', 'phone'].map(type => (
                <button key={type} onClick={() => {setLoginType(type); setOtpSent(false);}} 
                  className={`flex-1 py-2.5 text-[11px] rounded-lg transition-all ${loginType === type ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {loginType === 'email' ? (
            <form onSubmit={handleAuth} className="space-y-3">
              {isSignUp && <input type="text" placeholder="Full Name" className="w-full p-3 border rounded-xl outline-none text-[15px]" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />}
              <input type="email" placeholder="Email Address" className="w-full p-3 border rounded-xl outline-none text-[15px]" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              
              <div className="relative w-full">
                <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-3 border rounded-xl outline-none text-[15px] pr-10" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                <button type="button" className="absolute right-3 top-3.5 text-gray-400" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>

              {isSignUp && (
                <div className="relative w-full">
                  <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" className="w-full p-3 border rounded-xl outline-none text-[15px] pr-10" value={formData.password_confirmation} onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})} />
                  <button type="button" className="absolute right-3 top-3.5 text-gray-400" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              )}
              
              <label className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-4 h-4" />
                <span className="text-[11px] text-gray-500">I agree to Terms & Conditions</span>
              </label>

              <button disabled={isButtonDisabled} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-[15px] disabled:opacity-40 transition">
                {loading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
              </button>
            </form>
          ) : (
             <div className="space-y-3">
               {!otpSent ? (
                 <>
                   <div className="flex border rounded-xl overflow-hidden text-[15px]">
                     <span className="bg-gray-100 p-3.5 text-gray-500 border-r">+91</span>
                     <input type="tel" maxLength="10" placeholder="Mobile number" className="w-full p-3.5 outline-none" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                   </div>
                   <button disabled={loading || !termsAccepted || formData.phone.length !== 10} onClick={() => setOtpSent(true)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold disabled:opacity-40">Send OTP</button>
                 </>
               ) : (
                 <><input type="text" maxLength="4" placeholder="Enter 4-digit OTP" className="w-full p-3 border rounded-xl text-center text-lg outline-none" value={otp} onChange={(e) => setOtp(e.target.value)} />
                 <button className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">Verify OTP</button></>
               )}
             </div>
          )}

          {!otpSent && (
            <div className="mt-6 flex flex-col items-center">
              <div className="text-[10px] text-gray-400 mb-2 font-bold tracking-widest">OR</div>
              <GoogleLogin onSuccess={handleGoogleSuccess} />
            </div>
          )}

          <p className="text-center text-sm text-gray-600 mt-6">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 font-bold hover:underline">
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
        </motion.div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;