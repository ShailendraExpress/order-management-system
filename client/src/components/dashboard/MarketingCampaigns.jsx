import React, { useState, useEffect } from 'react';
import { 
  RiMegaphoneLine, RiAddLine, RiSearchLine, 
  RiPlayLine, RiPauseLine, RiDeleteBinLine, RiCloseLine, RiMoneyDollarCircleLine, RiBarChartBoxLine 
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Import the secure global API instance and CSRF helper function
import api, { getCsrfCookie } from '../../utils/api';

const MarketingCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal and Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Sponsored Product',
    budget: '',
    start_date: '',
    end_date: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch campaigns on component load
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Securely fetch campaigns from the backend
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }
      const response = await api.get('/api/v1/admin/campaigns');
      const fetchedData = response.data?.data || response.data;
      setCampaigns(Array.isArray(fetchedData) ? fetchedData : []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load marketing campaigns.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validate dates before initiating campaign creation
  const handleCreateCampaign = (e) => {
    e.preventDefault();

    const today = new Date().toISOString().split('T')[0];

    // Prevent selecting a past date for campaign start
    if (formData.start_date < today) {
      toast.error("Cannot select a past date! Back-dating is not allowed.");
      return;
    }

    // Validate that the end date is not earlier than the start date
    if (formData.end_date < formData.start_date) {
      toast.error("End date cannot be earlier than start date!");
      return;
    }

    executeCreateCampaign();
  };

  // Securely submit new campaign data to the server
  const executeCreateCampaign = async () => {
    setSubmitting(true);
    try {
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }

      const response = await api.post('/api/v1/admin/campaigns', formData);
      toast.success(response.data?.message || "Campaign created successfully.");
      setIsModalOpen(false);
      setFormData({ name: '', type: 'Sponsored Product', budget: '', start_date: '', end_date: '' });
      fetchCampaigns();
    } catch (error) {
      console.error("Error creating campaign:", error);
      const errors = error.response?.data?.errors;
      if (errors) {
        const firstErrorKey = Object.keys(errors)[0];
        toast.error(errors[firstErrorKey][0]);
      } else {
        toast.error(error.response?.data?.message || "Failed to create campaign.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle campaign status between Active and Paused securely
  const handleToggleStatus = async (id) => {
    try {
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }

      const response = await api.patch(`/api/v1/admin/campaigns/${id}/status`);
      const updatedStatus = response.data?.data?.status;
      
      if (updatedStatus === 'Paused') {
        toast.success("Campaign paused successfully!");
      } else {
        toast.success("Campaign resumed successfully!");
      }
      
      fetchCampaigns();
    } catch (error) {
      console.error("Error updating campaign status:", error);
      toast.error("Failed to update status.");
    }
  };

  // Securely delete a campaign with confirmation
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Campaign?',
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, Delete it!'
    });

    if (result.isConfirmed) {
      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }

        await api.delete(`/api/v1/admin/campaigns/${id}`);
        toast.success("Campaign deleted successfully.");
        fetchCampaigns();
      } catch (error) {
        console.error("Error deleting campaign:", error);
        toast.error("Failed to delete campaign.");
      }
    }
  };

  // Filter campaigns based on search query and status filter
  const filteredCampaigns = campaigns.filter(camp => {
    const name = camp.name || '';
    const type = camp.type || '';
    const status = camp.status || '';

    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics securely with fallback defaults
  const totalBudget = campaigns.reduce((acc, curr) => acc + Number(curr.budget || 0), 0);
  const totalSpent = campaigns.reduce((acc, curr) => acc + Number(curr.spent || 0), 0);
  const activeCount = campaigns.filter(c => c.status === 'Active').length;

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <RiMegaphoneLine className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Marketing Campaigns</h1>
            <p className="text-xs text-slate-500 mt-0.5">Boost your product visibility with sponsored ads and promotions.</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <RiAddLine size={18} /> Create New Campaign
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold">
            <RiBarChartBoxLine />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Campaigns</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{activeCount}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold">
            <RiMoneyDollarCircleLine />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Budget Allocated</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalBudget.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-bold">
            <RiMoneyDollarCircleLine />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Ad Spend</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalSpent.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 border border-slate-200/80 rounded-xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search campaigns by name or type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-all cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-3xs flex items-center justify-center z-10">
            <span className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Campaign Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Budget</th>
                <th className="px-6 py-4">Spent</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-[13px]">{camp.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {camp.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{Number(camp.budget || 0).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">₹{Number(camp.spent || 0).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {camp.start_date} to {camp.end_date}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        camp.status === 'Active' 
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-600' 
                          : 'border border-amber-200 bg-amber-50 text-amber-600'
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleToggleStatus(camp.id)}
                          className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            camp.status === 'Active' 
                              ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title={camp.status === 'Active' ? 'Pause Campaign' : 'Resume Campaign'}
                        >
                          {camp.status === 'Active' ? <RiPauseLine size={16} /> : <RiPlayLine size={16} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(camp.id)}
                          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                          title="Delete Campaign"
                        >
                          <RiDeleteBinLine size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
                        <RiMegaphoneLine size={24} />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">No marketing campaigns found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Create New Campaign</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 cursor-pointer">
                <RiCloseLine size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Campaign Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="e.g. Summer Special Boost" 
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Campaign Type</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleInputChange} 
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="Sponsored Product">Sponsored Product</option>
                  <option value="Banner Ad">Banner Ad</option>
                  <option value="Flash Sale Boost">Flash Sale Boost</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Total Budget (₹)</label>
                <input 
                  type="number" 
                  name="budget" 
                  required 
                  value={formData.budget} 
                  onChange={handleInputChange} 
                  placeholder="5000" 
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-all" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Start Date</label>
                  <input 
                    type="date" 
                    name="start_date" 
                    required 
                    value={formData.start_date} 
                    onChange={handleInputChange} 
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">End Date</label>
                  <input 
                    type="date" 
                    name="end_date" 
                    required 
                    value={formData.end_date} 
                    onChange={handleInputChange} 
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-all" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-md cursor-pointer disabled:opacity-70 flex items-center gap-2"
                >
                  {submitting ? 'Creating...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default React.memo(MarketingCampaigns);