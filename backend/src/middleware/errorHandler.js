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
