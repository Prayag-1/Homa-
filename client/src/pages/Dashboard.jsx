import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getMyOrders, downloadInvoice } from '../services/orderService';
import { formatPrice } from '../utils/formatPrice';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { 
  User, MapPin, ShoppingBag, Award, Edit2, Calendar, Droplets, 
  ChevronDown, ChevronUp, Download, Eye, ShieldAlert, LogOut, CheckCircle2 
} from 'lucide-react';
import { AddressMapPicker } from '../components/shared';
import { getResponsiveImageProps } from '../utils/cloudinaryUrl';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
  phoneNumber: z.string().trim().max(20, 'Phone number is too long').optional(),
  birthday: z.string().optional(),
  skinType: z.enum(['', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Acne-Prone']).optional(),
  address: z.object({
    line1: z.string().trim().max(160).optional(),
    line2: z.string().trim().max(160).optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    postalCode: z.string().trim().max(20).optional(),
    country: z.string().trim().max(80).optional(),
  }),
});

export default function Dashboard() {
  const { user, updateProfile, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, profile
  const [expandedOrders, setExpandedOrders] = useState({});
  const [downloadingInvoice, setDownloadingInvoice] = useState({});
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: `Orders${orders.length > 0 ? ` (${orders.length})` : ''}`, icon: ShoppingBag },
    { id: 'profile', label: 'Edit Profile', icon: Edit2 },
  ];

  // Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    birthday: '',
    skinType: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nepal',
  });

  const addressPreview = [
    formData.line1,
    formData.line2,
    formData.city,
    formData.state,
    formData.postalCode,
    formData.country,
  ].filter(Boolean).join(', ');

  // Pre-fill profile form when user context is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phoneNumber: user.phone || user.phoneNumber || '',
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
        skinType: user.skinType || '',
        line1: user.address?.line1 || '',
        line2: user.address?.line2 || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        postalCode: user.address?.postalCode || '',
        country: user.address?.country || 'Nepal',
      });
    }
  }, [user]);

  // Fetch Order History
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const res = await getMyOrders();
        setOrders(res.data);
      } catch (err) {
        toast.error('Failed to load order history');
      } finally {
        setOrdersLoading(false);
      }
    };
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMapLocationSelect = (selection) => {
    if (!selection?.address) return;

    setFormData((prev) => ({
      ...prev,
      line1: selection.address.line1 || selection.label || prev.line1,
      line2: selection.address.line2 || prev.line2,
      city: selection.address.city || prev.city,
      state: selection.address.state || prev.state,
      postalCode: selection.address.postalCode || prev.postalCode,
      country: selection.address.country || prev.country,
    }));

    toast.success('Shipping address updated from the map');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      birthday: formData.birthday,
      skinType: formData.skinType || undefined,
      address: {
        line1: formData.line1.trim(),
        line2: formData.line2.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
      },
    };

    const parsed = profileSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Please check your profile details');
      return;
    }

    try {
      await updateProfile(parsed.data);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleDownloadInvoice = async (orderId, invoiceNumber) => {
    setDownloadingInvoice((prev) => ({ ...prev, [orderId]: true }));
    try {
      await downloadInvoice(orderId, invoiceNumber);
      toast.success('Invoice downloaded!');
    } catch {
      toast.error('Failed to download invoice PDF.');
    } finally {
      setDownloadingInvoice((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      window.location.href = '/login';
    } catch {
      toast.error('Logout failed');
    }
  };

  // Determine membership card theme color
  const getTierTheme = (tier) => {
    switch (tier) {
      case 'Bronze':
        return 'from-orange-200 via-amber-400 to-orange-700 text-white border-orange-300';
      case 'Platinum':
        return 'from-gray-700 via-gray-900 to-black text-white border-gray-600';
      case 'Gold':
        return 'from-amber-400 via-yellow-600 to-amber-800 text-white border-amber-500';
      default: // Silver
        return 'from-slate-200 via-slate-400 to-slate-600 text-slate-800 border-slate-300';
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  // Count total purchased items
  const totalPurchasedQty = orders.reduce((sum, order) => {
    if (order.paymentStatus === 'paid') {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <p className="font-body text-gray-500 text-sm mt-1">
              Welcome back, {user.name}. Manage your routine, view rewards, and track your skin-care journey.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <span className="font-heading text-3xl text-black">Profile</span>
            <button
              onClick={handleLogout}
              className="touch-target inline-flex items-center justify-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 font-body text-xs font-semibold px-5 py-3 rounded-xl transition-all"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>

        <div className="scroll-x-mobile mb-6 border-b border-gray-200 px-0 py-3 lg:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setIsEditing(false); }}
                className={`touch-target whitespace-nowrap rounded-full px-4 py-2 font-body text-sm font-semibold ${
                  active ? 'bg-homa-red text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dashboard grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Navigation Sidebar */}
          <div className="hidden lg:col-span-3 lg:block space-y-6">
            
            {/* Membership Card */}
            <div className={`relative rounded-3xl border overflow-hidden p-6 bg-gradient-to-tr ${getTierTheme(user.membershipTier)} shadow-md`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-75">
                    HOMA Membership
                  </span>
                  <h3 className="font-heading text-2xl font-bold mt-1">
                    {user.membershipTier || 'Bronze'}
                  </h3>
                </div>
                <Award size={36} className="opacity-80" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider opacity-60">Loyalty Balance</p>
                <p className="text-3xl font-bold font-heading">{user.loyaltyPoints || 0} pts</p>
              </div>
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
                <Award size={150} />
              </div>
            </div>

            {/* Sidebar Buttons */}
            <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm space-y-1">
              <button
                onClick={() => { setActiveTab('overview'); setIsEditing(false); }}
                className={`touch-target w-full justify-start text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                  activeTab === 'overview' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <User size={16} />
                Overview
              </button>
              <button
                onClick={() => { setActiveTab('orders'); setIsEditing(false); }}
                className={`touch-target w-full justify-start text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                  activeTab === 'orders' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <ShoppingBag size={16} />
                Order History
                {orders.length > 0 && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${activeTab === 'orders' ? 'bg-white text-black' : 'bg-gray-100 text-gray-700'}`}>
                    {orders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('profile'); setIsEditing(false); }}
                className={`touch-target w-full justify-start text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                  activeTab === 'profile' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic Panel content */}
          <div className="lg:col-span-9 space-y-8">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* Grid Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Orders</p>
                      <h4 className="text-3xl font-heading font-bold mt-2 text-black">{orders.length}</h4>
                      <p className="text-[10px] text-gray-500 mt-1">Placed in total</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Items Purchased</p>
                      <h4 className="text-3xl font-heading font-bold mt-2 text-black">{totalPurchasedQty}</h4>
                      <p className="text-[10px] text-gray-500 mt-1">Confirmed orders</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Skin Type</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Droplets size={22} className="text-blue-500" />
                        <h4 className="text-xl font-heading font-bold text-black">{user.skinType || 'Not specified'}</h4>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">Tailored catalog settings</p>
                    </div>
                  </div>

                  {/* Summary Profile Info Card */}
                  <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
                      <h3 className="font-heading text-xl text-black flex items-center gap-2.5">
                        <User size={18} className="text-gray-400" />
                        Personal Profile
                      </h3>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="touch-target text-xs font-semibold hover:underline text-black"
                      >
                        Edit Profile
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-sm leading-relaxed">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Full Name</p>
                        <p className="text-gray-800 font-semibold">{user.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Email Address</p>
                        <p className="text-gray-800 font-semibold">{user.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Phone Number</p>
                        <p className="text-gray-800 font-semibold">{user.phone || user.phoneNumber || 'Not linked'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Date of Birth</p>
                        <div className="flex items-center gap-1 text-gray-700 font-semibold">
                          <Calendar size={14} className="text-gray-400" />
                          {user.birthday ? new Date(user.birthday).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Default Delivery Address Card */}
                  <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
                      <h3 className="font-heading text-xl text-black flex items-center gap-2.5">
                        <MapPin size={18} className="text-gray-400" />
                        Default Shipping Address
                      </h3>
                    </div>

                    {user.address?.line1 ? (
                      <div className="text-sm leading-relaxed text-gray-700">
                        <p className="font-semibold">{user.name}</p>
                        <p className="mt-1">{user.address.line1}</p>
                        {user.address.line2 && <p>{user.address.line2}</p>}
                        <p>{user.address.city}, {user.address.state} - {user.address.postalCode}</p>
                        <p className="mt-1 font-semibold text-xs text-gray-400 uppercase tracking-wider">{user.address.country}</p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500 mb-4">No default shipping address configured yet.</p>
                        <button
                          onClick={() => { setActiveTab('profile'); setIsEditing(true); }}
                          className="touch-target px-5 py-2.5 bg-black hover:bg-gray-950 text-white rounded-xl text-xs font-semibold transition-all"
                        >
                          Configure Address
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: ORDER HISTORY */}
              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <h2 className="font-heading text-2xl text-black mb-4">Order History</h2>

                  {ordersLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 bg-white border border-gray-150 rounded-2xl animate-pulse"></div>
                      ))}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center">
                      <div className="mx-auto w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <ShoppingBag size={20} />
                      </div>
                      <p className="text-gray-500 text-sm">You haven't placed any orders yet.</p>
                      <Link
                        to="/shop"
                        className="mt-5 inline-flex bg-black hover:bg-gray-900 text-white font-body text-xs font-semibold px-6 py-3 rounded-xl transition-all"
                      >
                        Explore shop
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const isExpanded = !!expandedOrders[order._id];
                        return (
                          <div
                            key={order._id}
                            className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm transition-all"
                          >
                            {/* Order summary bar */}
                            <div
                              onClick={() => toggleOrderExpand(order._id)}
                              className="px-4 py-4 md:px-6 md:py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-body text-sm font-bold text-gray-800">
                                    {order.invoiceNumber || 'INV-PENDING'}
                                  </span>
                                  <span className={`inline-flex px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                    order.paymentStatus === 'paid' 
                                      ? 'bg-green-50 text-green-700' 
                                      : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {order.paymentStatus}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                  Date: {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="flex flex-wrap md:flex-nowrap items-center gap-6 text-xs text-left w-full md:w-auto justify-between md:justify-end">
                                <div>
                                  <p className="text-gray-400 font-medium">Items</p>
                                  <p className="font-semibold text-gray-800 mt-0.5">
                                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400 font-medium">Grand Total</p>
                                  <p className="font-bold text-black text-sm mt-0.5">
                                    {formatPrice(order.grandTotal)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400 font-medium">Status</p>
                                  <span className="inline-flex items-center gap-1.5 font-bold uppercase text-[9px] text-gray-700 mt-1">
                                    {order.orderStatus}
                                  </span>
                                </div>
                                <div className="touch-target rounded-lg bg-gray-50 text-gray-500 hover:text-black">
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                              </div>
                            </div>

                            {/* Expanded details panel */}
                            {isExpanded && (
                              <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50/20 space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                                  <div className="text-xs text-gray-500">
                                    <p>Payment Method: <span className="font-semibold uppercase">{order.paymentMethod}</span></p>
                                    {order.paymentRef && <p className="mt-1">Transaction Ref: <span className="font-mono">{order.paymentRef}</span></p>}
                                  </div>
                                  <button
                                    onClick={() => handleDownloadInvoice(order._id, order.invoiceNumber)}
                                    disabled={downloadingInvoice[order._id] || !order.invoiceNumber}
                                    className="touch-target inline-flex items-center gap-2 bg-black hover:bg-gray-900 disabled:bg-gray-200 text-white disabled:text-gray-400 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
                                  >
                                    {downloadingInvoice[order._id] ? (
                                      <>
                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                                        Fetching PDF...
                                      </>
                                    ) : (
                                      <>
                                        <Download size={13} />
                                        Download Bill / Invoice
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Item Row List */}
                                <div className="space-y-4">
                                  {order.items.map((item) => (
                                    <div key={item._id} className="flex justify-between items-center text-xs">
                                      <div className="flex items-center gap-3">
                                        <div className="h-12 w-10 flex-shrink-0 bg-white border border-gray-100 rounded overflow-hidden">
                                          <img {...getResponsiveImageProps(item.image || '/placeholder.jpg', item.name, '40px')} className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-800">{item.name}</p>
                                          <p className="text-gray-400 mt-0.5">{item.quantity} × {formatPrice(item.price)}</p>
                                        </div>
                                      </div>
                                      <span className="font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Order Address Summary */}
                                <div className="bg-gray-50 rounded-xl p-4 text-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-gray-400 font-medium mb-1">Shipping Details</p>
                                    <p className="text-gray-700 leading-normal">
                                      {order.shippingAddress?.street},<br />
                                      {order.shippingAddress?.city}, Nepal
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 font-medium mb-1">Receipt Breakdowns</p>
                                    <div className="space-y-1 text-gray-600">
                                      <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(order.subtotal)}</span>
                                      </div>
                                      {order.discount > 0 && (
                                        <div className="flex justify-between text-red-600">
                                          <span>Discount ({order.couponCode || 'Coupon'})</span>
                                          <span>-{formatPrice(order.discount)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span>VAT (13%)</span>
                                        <span>{formatPrice(order.vatAmount)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Delivery</span>
                                        <span>{order.deliveryCharge === 0 ? 'Free' : formatPrice(order.deliveryCharge)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 3: EDIT PROFILE */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white rounded-2xl border border-gray-150 p-6 md:p-8 shadow-sm"
                >
                  <h2 className="font-heading text-2xl text-black mb-6">Profile Settings</h2>

                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-50 pb-2">
                        Account Details
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Full Name"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="phoneNumber" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="E.g., 98XXXXXXXX"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="birthday" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Birthday
                          </label>
                          <input
                            type="date"
                            id="birthday"
                            name="birthday"
                            value={formData.birthday}
                            onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="skinType" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Skin Type
                          </label>
                          <select
                            id="skinType"
                            name="skinType"
                            value={formData.skinType}
                            onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                          >
                            <option value="">Choose Skin Type</option>
                            <option value="Oily">Oily</option>
                            <option value="Dry">Dry</option>
                            <option value="Combination">Combination</option>
                            <option value="Sensitive">Sensitive</option>
                            <option value="Acne-Prone">Acne-Prone</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Address details */}
                    <div className="space-y-4 pt-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-50 pb-2">
                        Delivery Address
                      </h3>

                      <div>
                        <label htmlFor="line1" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          id="line1"
                          name="line1"
                          value={formData.line1}
                          onChange={handleInputChange}
                          placeholder="Street address, P.O. box, company name"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                        />
                      </div>

                      <div>
                        <label htmlFor="line2" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Address Line 2 (Optional)
                        </label>
                        <input
                          type="text"
                          id="line2"
                          name="line2"
                          value={formData.line2}
                          onChange={handleInputChange}
                          placeholder="Apartment, suite, unit, building, floor, etc."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                        />
                      </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-2 md:col-span-1">
                          <label htmlFor="city" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="E.g., Kathmandu"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                          />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <label htmlFor="state" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="E.g., Bagmati"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="postalCode" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            id="postalCode"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            placeholder="E.g., 44600"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="country" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Country
                          </label>
                          <input
                            type="text"
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                          />
                        </div>
                      </div>

                      <AddressMapPicker
                        address={addressPreview}
                        title="Shipping address preview"
                        description="Click the map to pick a location and fill in the shipping address fields."
                        editable
                        onLocationSelect={handleMapLocationSelect}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => { setActiveTab('overview'); setIsEditing(false); }}
                        className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-black hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition-colors"
                      >
                        Save Settings
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
