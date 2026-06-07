const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (err.name === 'CastError' || err.kind === 'ObjectId') {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: 'Value already exists' });
  }

  if (err.name === 'ValidationError') {
    const firstMessage = Object.values(err.errors)[0]?.message || 'Validation failed';
    return res.status(400).json({ success: false, message: firstMessage });
  }

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode >= 500
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
