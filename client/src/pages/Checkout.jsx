import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuthContext } from '../context/AuthContext';
import { createOrder, validateCoupon } from '../services/orderService';
import { formatPrice } from '../utils/formatPrice';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CreditCard, ShoppingBag, Truck, CheckCircle2, Ticket } from 'lucide-react';
import { AddressMapPicker } from '../components/shared';


export default function Checkout() {
  const navigate = useNavigate();
  const { items, itemCount, subtotal, vatAmount, grandTotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuthContext();

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
  const [paymentMethod, setPaymentMethod] = useState('esewa');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill user details if available
  useEffect(() => {
    if (user) {
      setShippingDetails({
        street: user.address?.line1 || '',
        city: user.address?.city || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

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
    e.preventDefault();

    // Basic validation
    if (!shippingDetails.street.trim()) {
      return toast.error('Street address is required');
    }
    if (!shippingDetails.city.trim()) {
      return toast.error('City is required');
    }
    if (!shippingDetails.phone.trim() || !/^\+?[1-9]\d{9,14}$/.test(shippingDetails.phone.trim())) {
      return toast.error('Please enter a valid phone number');
    }

    setIsSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        product: item._id || item.id,
        quantity: item.quantity,
      }));

      const orderData = {
        items: orderItems,
        shippingAddress: {
          street: shippingDetails.street.trim(),
          city: shippingDetails.city.trim(),
          phone: shippingDetails.phone.trim(),
        },
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        notes: notes.trim() || undefined,
      };

      const res = await createOrder(orderData);

      if (paymentMethod === 'esewa') {
        const { esewaParams } = res.data;
        toast.loading('Redirecting to eSewa payment page...');

        // Programmatically submit POST form to eSewa portal
        const form = document.createElement('form');
        form.setAttribute('method', 'POST');
        form.setAttribute('action', esewaParams.esewa_form_url);

        for (const key in esewaParams) {
          if (key !== 'esewa_form_url') {
            const input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', key);
            input.setAttribute('value', esewaParams[key]);
            form.appendChild(input);
          }
        }

        document.body.appendChild(form);
        form.submit();
      } else if (paymentMethod === 'cod') {
        // Cash on delivery - order created directly
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/payment-success?orderId=${res.data.order._id}`);
      }
    } catch (err) {
      console.error(err);
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
    <div className="min-h-screen bg-[#fafaf9] py-12">
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

        <h1 className="font-display text-4xl text-black mb-10">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Shipping & Payment Info */}
          <div className="lg:col-span-7 space-y-8">
            {/* Shipping Details Card */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <Truck size={20} />
                </div>
                <h2 className="font-display text-xl text-black">Shipping Address</h2>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <h2 className="font-display text-xl text-black">Payment Method</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* eSewa Option */}
                <div
                  onClick={() => setPaymentMethod('esewa')}
                  className={`flex flex-col justify-between border-2 rounded-xl p-5 cursor-pointer select-none transition-all ${
                    paymentMethod === 'esewa'
                      ? 'border-green-600 bg-green-50/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800 text-sm">eSewa Wallet (UAT)</span>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'esewa' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'esewa' && <div className="h-2 w-2 rounded-full bg-white"></div>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Pay securely using eSewa. You will be redirected to the secure sandbox payment page to authorize your purchase.
                  </p>
                  <div className="flex items-center gap-2">
                    {/* Tiny green brand label */}
                    <div className="h-6 w-16 bg-green-600 text-white text-[10px] font-bold rounded flex items-center justify-center uppercase tracking-widest">
                      esewa
                    </div>
                    <span className="text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded font-medium">UAT Mode</span>
                  </div>
                </div>

                {/* COD Option */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex flex-col justify-between border-2 rounded-xl p-5 cursor-pointer select-none transition-all ${
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
                      {paymentMethod === 'cod' && <div className="h-2 w-2 rounded-full bg-white"></div>}
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
            </div>
          </div>

          {/* Right: Cart Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <ShoppingBag size={20} />
                </div>
                <h2 className="font-display text-xl text-black">Order Summary</h2>
              </div>

              {/* Items List */}
              <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100 pr-2 mb-6">
                {items.map((item) => {
                  const id = item._id || item.id;
                  const image = item.images?.[0]?.url || item.image || '/placeholder.jpg';
                  return (
                    <div key={id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="h-16 w-14 flex-shrink-0 overflow-hidden bg-gray-50 border border-gray-100 rounded-lg">
                        <img src={image} alt={item.name} className="h-full w-full object-cover" />
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
                    {paymentMethod === 'esewa' ? 'Pay with eSewa' : 'Place COD Order'}
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
    </div>
  );
}
