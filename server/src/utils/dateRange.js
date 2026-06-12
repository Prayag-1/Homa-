const ApiError = require('./ApiError');

const parseDateRange = (from, to, defaultDays = 30) => {
  const now = new Date();

  let startDate = from
    ? new Date(from)
    : new Date(now.setDate(now.getDate() - defaultDays));

  let endDate = to ? new Date(to) : new Date();

  // SECURITY: validate dates are actual dates
  if (isNaN(startDate.getTime())) throw new ApiError(400, 'Invalid from date');
  if (isNaN(endDate.getTime())) throw new ApiError(400, 'Invalid to date');

  // SECURITY: prevent future end dates
  if (endDate > new Date()) endDate = new Date();

  // SECURITY: prevent range larger than 1 year (prevents DB overload)
  const maxRange = 365 * 24 * 60 * 60 * 1000;
  if (endDate - startDate > maxRange) {
    throw new ApiError(400, 'Date range cannot exceed 365 days');
  }

  // Set to start and end of day in Nepal timezone offset (UTC+5:45)
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

module.exports = { parseDateRange };
