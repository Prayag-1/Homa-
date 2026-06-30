import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { verifyEsewaPayment, getOrderDetails, downloadInvoice } from '../services/orderService';
import { formatPrice } from '../utils/formatPrice';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Check, Download, ShoppingBag, Calendar, CreditCard, User, MapPin, AlertCircle, RefreshCw, Clock3 } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  
  const dataParam = searchParams.get('data');
  const orderIdParam = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [downloading, setDownloading] = useState(false);
  
  // Use a ref to prevent double verification checks due to React StrictMode double rendering
  const verificationStarted = useRef(false);

  useEffect(() => {
    const processOrder = async () => {
      // 1. If a payment callback payload is present, verify it first
      if (dataParam) {
        if (verificationStarted.current) return;
        verificationStarted.current = true;
        
        try {
          setLoading(true);
          const res = await verifyEsewaPayment({ data: dataParam });
          setOrder(res.data);
          clearCart(); // Clear cart now that payment is confirmed
          toast.success('Payment verified successfully!');
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to verify payment.');
          toast.error('Payment verification failed.');
        } finally {
          setLoading(false);
        }
      } 
      // 2. If it's a direct Cash on Delivery order success or navigation
      else if (orderIdParam) {
        try {
          setLoading(true);
          const res = await getOrderDetails(orderIdParam);
          setOrder(res.data);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch order details.');
        } finally {
          setLoading(false);
        }
      } 
      // 3. No parameters
      else {
        setLoading(false);
        setError('No order information found.');
      }
    };

    processOrder();
  }, [dataParam, orderIdParam, clearCart]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      await downloadInvoice(order._id, order.invoiceNumber);
      toast.success('Invoice downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download invoice PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-12 w-12 border-4 border-black border-t-transparent rounded-full mb-4"
        />
        <p className="font-body text-gray-600 text-sm animate-pulse">
          {dataParam ? 'Verifying payment...' : 'Loading order details...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl border border-gray-150 p-8 shadow-sm text-center"
        >
          <div className="mx-auto w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-5">
            <AlertCircle size={24} />
          </div>
          <h1 className="font-heading text-2xl text-black mb-3">Verification Error</h1>
          <p className="font-body text-sm text-gray-500 mb-6 leading-relaxed">
            {error}
          </p>
          <div className="space-y-3">
            <Link
              to="/checkout"
              className="block w-full bg-black py-3 rounded-xl font-body text-sm font-medium text-white hover:bg-gray-900 transition-colors"
            >
              Return to Checkout
            </Link>
            <Link
              to="/shop"
              className="block w-full bg-gray-100 py-3 rounded-xl font-body text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Back to Shop
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const isAwaitingReview = order?.paymentVerificationStatus === 'pending' || (order?.paymentMethod === 'qr' && order?.paymentStatus === 'pending');
  const isPaid = order?.paymentStatus === 'paid';
  const headerTitle = isAwaitingReview ? 'Payment Submitted' : 'Order Confirmed!';
  const headerSubtitle = isAwaitingReview
    ? 'Your QR payment proof has been submitted. Admin will verify it shortly.'
    : 'Thank you for shopping with HOMA Beauty. Your invoice details are generated below.';

  return (
    <div className="min-h-screen bg-[#fafaf9] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Top Success Badge */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center h-16 w-16 bg-green-100 text-green-600 rounded-full mb-6"
          >
            <Check size={32} strokeWidth={3} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-heading text-3xl md:text-4xl text-black"
          >
            {headerTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-body text-sm text-gray-500 mt-2"
          >
            {headerSubtitle}
          </motion.p>
        </div>

        {/* Invoice details sheet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden mb-8"
        >
          {/* Sheet Header */}
          <div className="bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Receipt / Invoice
              </p>
              <h3 className="font-body font-bold text-gray-800 mt-1">
                {order.invoiceNumber || 'INV-PENDING'}
              </h3>
            </div>
            <button
              onClick={handleDownloadInvoice}
              disabled={downloading || !order.invoiceNumber}
              className="inline-flex items-center gap-2 bg-black hover:bg-gray-900 disabled:bg-gray-200 text-white disabled:text-gray-400 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
            >
              {downloading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Download Invoice (PDF)
                </>
              )}
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Meta info grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs border-b border-gray-100 pb-6">
              <div>
                <p className="text-gray-400 font-medium mb-1">Date</p>
                <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
                  <Calendar size={13} className="text-gray-400" />
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-1">Payment Method</p>
                <div className="flex items-center gap-1.5 text-gray-700 font-semibold uppercase">
                  <CreditCard size={13} className="text-gray-400" />
                  {order.paymentMethod}
                </div>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-1">Payment Status</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                  isPaid
                    ? 'bg-green-50 text-green-700' 
                    : isAwaitingReview
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-100 text-gray-700'
                }`}>
                  {isAwaitingReview ? 'pending review' : order.paymentStatus}
                </span>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-1">Delivery Status</p>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-bold uppercase text-[9px] bg-blue-50 text-blue-700">
                  {order.orderStatus}
                </span>
              </div>
            </div>

            {/* Address & Customer details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-gray-100 pb-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                  <User size={13} className="text-gray-400" />
                  Customer Details
                </h4>
                <p className="text-gray-500 font-medium">Name: {order.user?.name || 'N/A'}</p>
                <p className="text-gray-500 font-medium mt-1">Email: {order.user?.email || 'N/A'}</p>
                <p className="text-gray-500 font-medium mt-1">Phone: {order.shippingAddress?.phone || order.user?.phone || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                  <MapPin size={13} className="text-gray-400" />
                  Shipping Address
                </h4>
                <p className="text-gray-500 font-medium leading-relaxed">
                  {order.shippingAddress?.street},<br />
                  {order.shippingAddress?.city}, Nepal
                </p>
              </div>
            </div>

            {/* Items Breakdown */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-1.5 text-xs">
                <ShoppingBag size={13} className="text-gray-400" />
                Purchased Items
              </h4>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item._id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-8 flex-shrink-0 bg-gray-50 border border-gray-100 rounded overflow-hidden">
                        <img src={item.image || '/placeholder.jpg'} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-gray-400 mt-0.5">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-800">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Box */}
            <div className="bg-gray-50/50 rounded-2xl p-5 text-xs space-y-2.5">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-gray-700">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({order.couponCode || 'Coupon'})</span>
                  <span className="font-medium">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Taxable Amount</span>
                <span className="font-medium text-gray-700">{formatPrice(order.taxableAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>VAT (13%)</span>
                <span className="font-medium text-gray-700">{formatPrice(order.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery Charge</span>
                <span className="font-medium text-gray-700">
                  {order.deliveryCharge === 0 ? 'Free' : formatPrice(order.deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200/60 pt-3 mt-2">
                <span>Grand Total</span>
                <span>{formatPrice(order.grandTotal)}</span>
              </div>
            </div>

            {isAwaitingReview && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <div className="flex items-start gap-3">
                  <Clock3 size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Waiting for admin verification</p>
                    <p className="mt-1 leading-6">
                      We received your payment proof. Once approved, your order will move to confirmed and your invoice will be available.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bottom Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            to="/shop"
            className="w-full sm:w-auto inline-flex justify-center items-center bg-black hover:bg-gray-900 text-white font-body text-sm font-semibold px-8 py-3.5 rounded-xl transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            to="/user/dashboard"
            className="w-full sm:w-auto inline-flex justify-center items-center bg-white hover:bg-gray-50 text-gray-700 font-body text-sm font-semibold border border-gray-200 px-8 py-3.5 rounded-xl transition-all"
          >
            Go to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
