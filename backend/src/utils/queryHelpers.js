const PRODUCT_SORT_WHITELIST = new Set([
  '-createdAt',
  'createdAt',
  'price',
  '-price',
  '-ratings.average',
  'ratings.average',
  'name',
  '-name',
]);

const ORDER_SORT_WHITELIST = new Set([
  '-createdAt',
  'createdAt',
  'grandTotal',
  '-grandTotal',
]);

const validateSort = (sort, whitelist, defaultSort = '-createdAt') => {
  if (!sort || typeof sort !== 'string') return defaultSort;
  return whitelist.has(sort) ? sort : defaultSort;
};

const validatePagination = (page, limit, maxLimit = 50, defaultLimit = 20) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || defaultLimit));
  const skip = (safePage - 1) * safeLimit;
  return { safePage, safeLimit, skip };
};

const sanitizeString = (val, maxLen = 200) => {
  if (!val || typeof val !== 'string') return undefined;
  return val.trim().slice(0, maxLen) || undefined;
};

module.exports = {
  validateSort,
  validatePagination,
  sanitizeString,
  PRODUCT_SORT_WHITELIST,
  ORDER_SORT_WHITELIST,
};
