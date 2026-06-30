import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuthContext } from '../context/AuthContext';
import { createOrder, validateCoupon } from '../services/orderService';
import { formatPrice } from '../utils/formatPrice';
import { usePublicSettings } from '../hooks/useSiteSettings';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CreditCard, ShoppingBag, Truck, CheckCircle2, Ticket, ChevronDown, Upload, ScanLine } from 'lucide-react';
import { AddressMapPicker } from '../components/shared';
import { getResponsiveImageProps } from '../utils/cloudinaryUrl';
import { z } from 'zod';

const checkoutSchema = z.object({
  shippingAddress: z.object({
    street: z.string().trim().min(3, 'Street address is required').max(120),
    city: z.string().trim().min(2, 'City is required').max(80),
    phone: z.string().trim().regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number'),
  }),
  paymentMethod: z.enum(['qr', 'cod']),
  couponCode: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});


export default function Checkout() {
  const navigate = useNavigate();
  const { items, itemCount, subtotal, vatAmount, grandTotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuthContext();
  const { data: settings } = usePublicSettings();

  // Shipping form state
  const [shippingDetails, setShippingDetails] = useState({
    street: '',
    city: '',
    phone: '',
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [notes, setNotes] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('qr');
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Pre-fill user details if available
  useEffect(() => {
    if (user) {
      setShippingDetails({
        street: user.address?.line1 || '',
        city: user.address?.city || '',
        phone: user.phone || user.phoneNumber || '',
      });
    }
  }, [user]);

  useEffect(
    () => () => {
      if (paymentProofPreview) {
        URL.revokeObjectURL(paymentProofPreview);
      }
    },
    [paymentProofPreview],
  );

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please login to checkout');
      navigate('/login?redirect=/checkout');
    }
    if (!authLoading && items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/shop');
    }
  }, [user, authLoading, items, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const res = await validateCoupon(couponCode, subtotal);
      setAppliedCoupon(res.data);
      toast.success(`Coupon "${res.data.code}" applied!`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid coupon code';
      toast.error(errorMsg);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const handlePaymentProofChange = (file) => {
    if (!file) return;

    if (paymentProofPreview) {
      URL.revokeObjectURL(paymentProofPreview);
    }

    setPaymentProofFile(file);
    setPaymentProofPreview(URL.createObjectURL(file));
  };

  const removePaymentProof = () => {
    if (paymentProofPreview) {
      URL.revokeObjectURL(paymentProofPreview);
    }
    setPaymentProofFile(null);
    setPaymentProofPreview('');
  };

  // Calculate dynamic totals based on coupon
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const deliveryCharge = subtotal > 2000 ? 0 : 100;
  const taxableAmount = subtotal - discountAmount;
  const vatAmountFinal = parseFloat((taxableAmount * 0.13).toFixed(2));
  const grandTotalFinal = parseFloat((taxableAmount + vatAmountFinal + deliveryCharge).toFixed(2));

  const addressPreview = [
    shippingDetails.street,
    shippingDetails.city,
    'Nepal',
  ].filter(Boolean).join(', ');


  const handlePlaceOrder = async (e) => {
    e?.preventDefault();

    const parsed = checkoutSchema.safeParse({
      shippingAddress: shippingDetails,
      paymentMethod,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      notes,
    });
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0]?.message || 'Please check your checkout details');
    }

    if (paymentMethod === 'qr' && !paymentProofFile) {
      return toast.error('Please upload your payment proof before submitting the order');
    }

    setIsSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        product: item._id || item.id,
        quantity: item.quantity,
      }));

      const orderData = {
        items: orderItems,
        ...parsed.data,
        notes: parsed.data.notes || undefined,
        paymentProofFile: paymentMethod === 'qr' ? paymentProofFile : undefined,
      };

      const res = await createOrder(orderData);
      clearCart();
      toast.success(paymentMethod === 'qr' ? 'Payment proof submitted successfully!' : 'Order placed successfully!');
      navigate(`/payment-success?orderId=${res.data.order._id}`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to place order';
      toast.error(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 pb-28 md:py-12 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            to="/shop"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Shopping
          </Link>
        </div>

        <h1 className="font-heading text-4xl text-black mb-10">Checkout</h1>

        <div className="lg:hidden border border-gray-200 rounded-xl mb-6 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setSummaryOpen((current) => !current)}
            className="touch-target w-full flex justify-between items-center p-4 text-left"
          >
            <span className="font-body text-sm font-semibold text-black">
              Order Summary ({itemCount} items)
            </span>
            <span className="flex items-center gap-2 font-bold text-black">
              {formatPrice(grandTotalFinal)}
              <ChevronDown size={18} className={`transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
            </span>
          </button>
          {summaryOpen && (
            <div className="px-4 pb-4">
              <div className="max-h-[180px] overflow-y-auto divide-y divide-gray-100 mb-4">
                {items.map((item) => {
                  const id = item._id || item.id;
                  const image = item.images?.[0]?.url || item.image || '/placeholder.jpg';
                  return (
                    <div key={id} className="flex gap-3 py-3">
                      <div className="h-14 w-12 flex-shrink-0 overflow-hidden bg-gray-50 border border-gray-100 rounded-lg">
                        <img {...getResponsiveImageProps(image, item.name, '48px')} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-body text-sm font-medium text-black truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-body text-sm font-semibold text-black">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>-{formatPrice(discountAmount)}</span></div>}
                <div className="flex justify-between text-gray-600"><span>VAT (13%)</span><span>{formatPrice(vatAmountFinal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{deliveryCharge === 0 ? 'Free' : formatPrice(deliveryCharge)}</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-black"><span>Total</span><span>{formatPrice(grandTotalFinal)}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Left: Shipping & Payment Info */}
          <div className="flex-1 space-y-8">
            {/* Shipping Details Card */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <Truck size={20} />
                </div>
                <h2 className="font-heading text-xl text-black">Shipping Address</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="street" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={shippingDetails.street}
                    onChange={handleInputChange}
                    placeholder="E.g., 12 Pine Street, Baluwatar"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={shippingDetails.city}
                      onChange={handleInputChange}
                      placeholder="E.g., Kathmandu"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Phone Number (for delivery)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={shippingDetails.phone}
                      onChange={handleInputChange}
                      placeholder="E.g., 98XXXXXXXX"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                      required
                    />
                  </div>
                </div>

                <AddressMapPicker
                  address={addressPreview}
                  title="Delivery location preview"
                  description="Leaflet previews the delivery location based on the street and city details you entered."
                  className="mt-2"
                />

                <div>
                  <label htmlFor="notes" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes about your delivery, e.g., special instructions for the rider."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector Card */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <CreditCard size={20} />
                </div>
                <h2 className="font-heading text-xl text-black">Payment Method</h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* QR Payment Option */}
                <div
                  onClick={() => setPaymentMethod('qr')}
                  className={`flex min-h-[64px] flex-col justify-between border-2 rounded-xl p-5 cursor-pointer select-none transition-all ${
                    paymentMethod === 'qr'
                      ? 'border-green-600 bg-green-50/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800 text-sm">QR Payment</span>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'qr' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'qr' && <CheckCircle2 size={13} />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Scan the QR code, pay, and upload the payment screenshot before placing the order.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-16 bg-black text-white text-[10px] font-bold rounded flex items-center justify-center uppercase tracking-widest">
                      qr
                    </div>
                    <span className="text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded font-medium">Manual review</span>
                  </div>
                </div>

                {/* COD Option */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex min-h-[64px] flex-col justify-between border-2 rounded-xl p-5 cursor-pointer select-none transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-black bg-gray-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800 text-sm">Cash on Delivery (COD)</span>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'cod' ? 'border-black bg-black text-white' : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'cod' && <CheckCircle2 size={13} />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Pay cash upon delivery. Perfect if you prefer checking products before making payment.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-12 bg-black text-white text-[10px] font-bold rounded flex items-center justify-center uppercase tracking-widest">
                      cod
                    </div>
                  </div>
                </div>
              </div>

              {paymentMethod === 'qr' && (
                <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-black p-2 text-white">
                      <ScanLine size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-black">{settings?.payment?.qrTitle || 'Scan the QR code and upload proof'}</h3>
                      <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                        {settings?.payment?.qrInstructions || 'Pay using the QR code and upload the payment proof screenshot before submitting your order.'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    {settings?.payment?.qrImage?.url ? (
                      <img
                        src={settings.payment.qrImage.url}
                        alt="Payment QR code"
                        className="mx-auto h-60 w-full max-w-[320px] object-contain"
                      />
                    ) : (
                      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center">
                        <p className="max-w-xs text-sm text-gray-500">
                          QR code not configured yet. Please contact support to complete your payment.
                        </p>
                      </div>
                    )}
                    <p className="mt-3 text-center text-xs font-medium text-gray-500">
                      Beneficiary: {settings?.payment?.beneficiaryName || 'HOMA Beauty'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Upload Payment Proof
                    </label>
                    <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white px-4 py-6 text-center transition hover:border-gray-300">
                      <Upload size={20} className="text-gray-400" />
                      <span className="mt-2 font-semibold text-gray-700">
                        {paymentProofFile ? 'Replace payment proof' : 'Click to upload payment screenshot'}
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        JPEG, PNG, or WebP up to 5MB
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handlePaymentProofChange(file);
                          event.target.value = '';
                        }}
                      />
                    </label>

                    {paymentProofPreview && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                        <img src={paymentProofPreview} alt="Payment proof preview" className="h-44 w-full object-contain bg-gray-50" />
                        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-3 py-2 text-xs">
                          <span className="truncate text-gray-600">{paymentProofFile?.name}</span>
                          <button type="button" onClick={removePaymentProof} className="font-semibold text-red-600 hover:text-red-700">
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <label htmlFor="paymentPhone" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Phone Number for Payment & Delivery
                </label>
                <input
                  type="tel"
                  id="paymentPhone"
                  name="phone"
                  value={shippingDetails.phone}
                  onChange={handleInputChange}
                  placeholder="E.g., 98XXXXXXXX"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  required
                />
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  This number is used for delivery updates and payment confirmation.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Cart Summary */}
          <div className="hidden lg:block lg:w-[40%] space-y-6">
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <ShoppingBag size={20} />
                </div>
                <h2 className="font-heading text-xl text-black">Order Summary</h2>
              </div>

              {/* Items List */}
              <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100 pr-2 mb-6">
                {items.map((item) => {
                  const id = item._id || item.id;
                  const image = item.images?.[0]?.url || item.image || '/placeholder.jpg';
                  return (
                    <div key={id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="h-16 w-14 flex-shrink-0 overflow-hidden bg-gray-50 border border-gray-100 rounded-lg">
                        <img {...getResponsiveImageProps(image, item.name, '56px')} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-body text-sm font-medium text-black truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-body text-sm font-semibold text-black">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={appliedCoupon || couponLoading}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal focus:bg-white focus:outline-none focus:border-black transition-all"
                  />
                </div>
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-5 py-2.5 bg-black text-white rounded-xl text-xs font-semibold hover:bg-gray-900 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                )}
              </form>

              {/* Calculation Summary */}
              <div className="space-y-3 border-t border-gray-100 pt-5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Taxable Amount</span>
                  <span>{formatPrice(taxableAmount)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>VAT (13%)</span>
                  <span>{formatPrice(vatAmountFinal)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charge</span>
                  <span>
                    {deliveryCharge === 0 ? (
                      <span className="text-green-600 font-semibold uppercase tracking-wider text-xs bg-green-50 px-2 py-0.5 rounded">
                        Free
                      </span>
                    ) : (
                      formatPrice(deliveryCharge)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-lg font-bold text-black border-t border-gray-150 pt-4 mt-2">
                  <span>Total</span>
                  <span>{formatPrice(grandTotalFinal)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="mt-6 w-full bg-black py-4 rounded-xl font-body text-sm font-semibold text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-800 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    {paymentMethod === 'qr' ? 'Submit Payment Proof' : 'Place COD Order'}
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-gray-400 mt-4 leading-normal">
                By placing this order, you agree to our Terms of Service & Privacy Policy. Taxes and delivery calculations are finalized by backend securely.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 safe-bottom lg:hidden"
        style={{
          transform: items.length > 0 ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease',
          pointerEvents: items.length > 0 ? 'auto' : 'none',
        }}
      >
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="touch-target w-full rounded-xl bg-black font-body text-sm font-semibold text-white transition-colors hover:bg-gray-900 disabled:bg-gray-800 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing Order...' : `${paymentMethod === 'qr' ? 'Submit Proof' : 'Place Order'} - ${formatPrice(grandTotalFinal)}`}
        </button>
      </div>
    </div>
  );
}
