import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// FiLock is imported here for the security section
import { FiUser, FiMapPin, FiChevronRight, FiEdit, FiTrash2, FiPlus, FiSave, FiX, FiLock } from "react-icons/fi";
import axios from "axios";
import swal from "sweetalert";

const MyProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Profile States
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });

  // Password States
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  });

  // Address States
  const [addresses, setAddresses] = useState([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    address_line: "",
    city: "",
    state: "",
    pincode: "",
    type: "home"
  });

  // Fetch Profile & Addresses on Load
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const userRes = await axios.get("http://127.0.0.1:8000/api/customer/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const addressRes = await axios.get("http://127.0.0.1:8000/api/customer/addresses", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (userRes.data.success) {
          setProfile(userRes.data.data);
          setProfileForm(userRes.data.data);
        }
        if (addressRes.data.success) {
          setAddresses(addressRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
      const response = await axios.put("http://127.0.0.1:8000/api/customer/profile", profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setProfile(response.data.data);
        setIsEditingProfile(false);
        swal("Success", "Profile updated successfully!", "success");
      }
    } catch (error) {
      swal("Error", "Failed to update profile.", "error");
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      swal("Error", "New password and confirmation do not match!", "error");
      return;
    }

    try {
      const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
      const response = await axios.put("http://127.0.0.1:8000/api/customer/password", passwordForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        swal("Success", "Password updated successfully!", "success");
        setIsChangingPassword(false);
        setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update password. Check your current password.";
      swal("Error", errorMsg, "error");
    }
  };

  // Handle Address Submit
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
      
      if (editingAddressId) {
        const response = await axios.put(`http://127.0.0.1:8000/api/customer/addresses/${editingAddressId}`, addressForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setAddresses(addresses.map(addr => addr.id === editingAddressId ? response.data.data : addr));
          swal("Updated!", "Address updated successfully.", "success");
        }
      } else {
        const response = await axios.post("http://127.0.0.1:8000/api/customer/addresses", addressForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setAddresses([...addresses, response.data.data]);
          swal("Added!", "New address added successfully.", "success");
        }
      }
      resetAddressForm();
    } catch (error) {
      swal("Error", "Failed to save address.", "error");
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id) => {
    const willDelete = await swal({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this address!",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (willDelete) {
      try {
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
        await axios.delete(`http://127.0.0.1:8000/api/customer/addresses/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAddresses(addresses.filter(addr => addr.id !== id));
        swal("Deleted!", "Address has been deleted.", "success");
      } catch (error) {
        swal("Error", "Failed to delete address.", "error");
      }
    }
  };

  const resetAddressForm = () => {
    setAddressForm({ address_line: "", city: "", state: "", pincode: "", type: "home" });
    setIsAddingAddress(false);
    setEditingAddressId(null);
  };

  const [locLoading, setLocLoading] = useState(false);

  // Function to detect current location using GPS
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      swal("Not Supported", "Your browser does not support GPS location.", "error");
      return;
    }

    setLocLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          if (data && data.address) {
            const addr = data.address;
            setAddressForm({
              address_line: data.display_name || "",
              city: addr.city || addr.town || addr.village || "",
              state: addr.state || "",
              pincode: addr.postcode || "",
              type: "home"
            });
            swal("Location Detected!", "Your address has been auto-filled successfully.", "success");
          }
        } catch (error) {
          console.error("GPS Error:", error);
          swal("Error", "Failed to fetch address details from your location.", "error");
        } finally {
          setLocLoading(false);
        }
      },
      (error) => {
        console.error(error);
        swal("Permission Denied", "Please allow location permissions in your browser to use this feature.", "error");
        setLocLoading(false);
      }
    );
  };

  const startEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm(addr);
    setIsAddingAddress(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p>Loading Profile Details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8 font-sans text-slate-800">
      <div className="max-w-[1500px] w-[95vw] lg:w-[90vw] mx-auto">
        
        <nav className="flex items-center text-sm text-slate-500 mb-6 font-medium">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <FiChevronRight className="mx-2 text-slate-400" />
          <span className="text-slate-900 font-bold">My Profile</span>
        </nav>

        {/* ========================================== */}
        {/* USER AVATAR & GREETING BANNER              */}
        {/* ========================================== */}
        <div className="mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full flex items-center justify-center text-3xl font-extrabold shadow-md shrink-0">
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="pt-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hello, {profile.name || "Customer"}!
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Manage your personal information, security, and delivery addresses here.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* ========================================== */}
          {/* LEFT COLUMN: PROFILE & SECURITY INFO       */}
          {/* ========================================== */}
          <div className="space-y-6">
            
            {/* Personal Info Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold uppercase text-slate-400 flex items-center gap-2">
                  <FiUser /> Personal Info
                </h2>
                {!isEditingProfile && (
                  <button 
                    onClick={() => setIsEditingProfile(true)} 
                    className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    <FiEdit /> Edit
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={profileForm.name} 
                      onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={profileForm.email} 
                      onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={profileForm.phone || ""} 
                      onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" 
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1">
                      <FiSave size={14} /> Save
                    </button>
                    <button type="button" onClick={() => { setIsEditingProfile(false); setProfileForm(profile); }} className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Full Name</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Email Address</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Phone Number</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile.phone || "Not Provided"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Account Security (Change Password) Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold uppercase text-slate-400 flex items-center gap-2">
                  <FiLock /> Security
                </h2>
                {!isChangingPassword && (
                  <button 
                    onClick={() => setIsChangingPassword(true)} 
                    className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    <FiEdit /> Change Password
                  </button>
                )}
              </div>

              {isChangingPassword ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Current Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.current_password} 
                      onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-1">New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.new_password} 
                      onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.new_password_confirmation} 
                      onChange={e => setPasswordForm({...passwordForm, new_password_confirmation: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" 
                      required 
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1">
                      <FiSave size={14} /> Update
                    </button>
                    <button type="button" onClick={() => { 
                      setIsChangingPassword(false); 
                      setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
                    }} className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <p className="text-xs text-slate-500">
                    It's a good idea to use a strong password that you're not using elsewhere to keep your account safe.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* ========================================== */}
          {/* RIGHT COLUMN: ADDRESS BOOK MANAGEMENT      */}
          {/* ========================================== */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold uppercase text-slate-400 flex items-center gap-2">
                  <FiMapPin /> Saved Addresses
                </h2>
                {!isAddingAddress && (
                  <button 
                    onClick={() => setIsAddingAddress(true)} 
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <FiPlus /> Add New
                  </button>
                )}
              </div>

              {/* Address Form (Add / Edit inline form) */}
              {isAddingAddress && (
                <form onSubmit={handleAddressSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold uppercase text-slate-700">
                      {editingAddressId ? "Modify Address" : "Create New Address"}
                    </h3>
                    <button type="button" onClick={resetAddressForm} className="text-slate-400 hover:text-slate-600">
                      <FiX size={16} />
                    </button>
                  </div>
                  
                  {/* GPS LOCATION BUTTON */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={locLoading}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
                    >
                      <FiMapPin /> {locLoading ? "Detecting Location..." : "Use Current Location (GPS)"}
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Street Address</label>
                    <input 
                      type="text" 
                      value={addressForm.address_line} 
                      onChange={e => setAddressForm({...addressForm, address_line: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" 
                      placeholder="Flat/House no, Colony, Street name"
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">City</label>
                      <input 
                        type="text" 
                        value={addressForm.city} 
                        onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">State</label>
                      <input 
                        type="text" 
                        value={addressForm.state} 
                        onChange={e => setAddressForm({...addressForm, state: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Pincode</label>
                      <input 
                        type="text" 
                        value={addressForm.pincode} 
                        onChange={e => setAddressForm({...addressForm, pincode: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" 
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Address Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center text-sm font-semibold cursor-pointer gap-1.5">
                        <input 
                          type="radio" 
                          name="type" 
                          value="home" 
                          checked={addressForm.type === "home"} 
                          onChange={e => setAddressForm({...addressForm, type: e.target.value})}
                          className="w-4 h-4 accent-blue-600"
                        />
                        Home (All Day Delivery)
                      </label>
                      <label className="flex items-center text-sm font-semibold cursor-pointer gap-1.5">
                        <input 
                          type="radio" 
                          name="type" 
                          value="work" 
                          checked={addressForm.type === "work"} 
                          onChange={e => setAddressForm({...addressForm, type: e.target.value})}
                          className="w-4 h-4 accent-blue-600"
                        />
                        Work (10 AM - 5 PM)
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 justify-end">
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700">
                      {editingAddressId ? "Update Address" : "Save Address"}
                    </button>
                  </div>
                </form>
              )}

              {/* Address List Display */}
              {addresses.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No saved addresses found. Add one to checkout faster!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="border border-slate-200 rounded-xl p-4 relative flex flex-col justify-between hover:border-slate-300 transition-colors">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 ${
                          addr.type === 'home' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {addr.type}
                        </span>
                        <p className="text-sm text-slate-800 font-medium leading-relaxed">{addr.address_line}</p>
                        <p className="text-xs text-slate-500 mt-1">{addr.city}, {addr.state} - <strong className="text-slate-700">{addr.pincode}</strong></p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-2 text-slate-400">
                        <button onClick={() => startEditAddress(addr)} className="hover:text-blue-600 transition-colors" title="Edit Address">
                          <FiEdit size={14} />
                        </button>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="hover:text-red-600 transition-colors" title="Delete Address">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MyProfile;