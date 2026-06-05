const VAT_RATE = 0.13;

const calculateOrderTotals = (items, discountAmount = 0, deliveryCharge = 0) => {
  const subtotal      = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxableAmount = subtotal - discountAmount;
  const vatAmount     = parseFloat((taxableAmount * VAT_RATE).toFixed(2));
  const grandTotal    = parseFloat((taxableAmount + vatAmount + deliveryCharge).toFixed(2));
  return { subtotal, discountAmount, taxableAmount, vatAmount, deliveryCharge, grandTotal, vatRate: VAT_RATE };
};

module.exports = { calculateOrderTotals, VAT_RATE };
