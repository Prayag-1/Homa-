const xss = require('xss');

const sanitizeOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe'],
};

const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return str;
  return xss(str.trim(), sanitizeOptions);
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitizeObject(item));

  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') result[key] = sanitizeString(val);
    else if (typeof val === 'object' && val !== null) result[key] = sanitizeObject(val);
    else result[key] = val;
  }
  return result;
};

module.exports = { sanitizeString, sanitizeObject };
