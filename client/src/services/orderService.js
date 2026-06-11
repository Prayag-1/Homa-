import api from './api';

/**
 * Place a new order
 * @param {Object} orderData - Shipping details, items, coupon, notes, and payment method
 */
export const createOrder = async (orderData) => {
  const { data } = await api.post('/orders', orderData);
  return data;
};

/**
 * Validate a coupon code
 * @param {string} code - The coupon code string
 * @param {number} subtotal - Subtotal amount of the cart
 */
export const validateCoupon = async (code, subtotal) => {
  const { data } = await api.post('/orders/validate-coupon', { code, subtotal });
  return data;
};


/**
 * Verify eSewa payment using base64 encoded data from eSewa redirect
 * @param {Object} payload - Object containing { data: base64String }
 */
export const verifyEsewaPayment = async (payload) => {
  const { data } = await api.post('/orders/verify-esewa', payload);
  return data;
};

/**
 * Get current user's order history
 */
export const getMyOrders = async () => {
  const { data } = await api.get('/orders/my');
  return data;
};

/**
 * Get details of a specific order
 * @param {string} id - Order ID
 */
export const getOrderDetails = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

/**
 * Download Invoice PDF
 * @param {string} id - Order ID
 * @param {string} invoiceNumber - Invoice Number (for naming the downloaded file)
 */
export const downloadInvoice = async (id, invoiceNumber) => {
  const response = await api.get(`/orders/${id}/invoice`, {
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `invoice-${invoiceNumber || id}.pdf`);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
