import api from './api';

/**
 * Submit a return request for an order
 * @param {Object} returnData - { orderId, reason, details }
 */
export const createReturnRequest = async (returnData) => {
  const { data } = await api.post('/returns', returnData);
  return data;
};

/**
 * Get current user's return requests
 */
export const getMyReturnRequests = async () => {
  const { data } = await api.get('/returns/my');
  return data;
};

/**
 * Admin: Get all return requests
 */
export const adminGetReturnRequests = async () => {
  const { data } = await api.get('/returns/admin/all');
  return data;
};

/**
 * Admin: Update return request status
 * @param {string} id - Return Request ID
 * @param {Object} payload - { status, adminNotes }
 */
export const adminUpdateReturnRequest = async (id, payload) => {
  const { data } = await api.put(`/returns/admin/${id}`, payload);
  return data;
};
