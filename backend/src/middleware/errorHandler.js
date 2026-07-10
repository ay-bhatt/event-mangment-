<<<<<<< HEAD
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
=======
export function errorHandler(err, _req, res, _next) {
  console.error('[API Error]', err)

  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal server error'

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && err.stack
      ? { stack: err.stack }
      : {}),
  })
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, message: 'Route not found' })
}
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
