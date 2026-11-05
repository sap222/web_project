export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'Route not found'));
}

// Express identifies error handlers by their four arguments.
export function errorHandler(err, _req, res, _next) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: `Invalid ${err.path}` });
  if (err.code === 11000) {
    return res.status(409).json({ message: `${Object.keys(err.keyValue)[0]} is already in use` });
  }
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
}
