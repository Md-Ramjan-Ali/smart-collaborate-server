import { ErrorRequestHandler } from 'express';
import config from '../config';

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong!';

  res.status(statusCode).json({
    success: false,
    message,
    stack: config.node_env === 'development' ? err.stack : null,
  });
};

export default globalErrorHandler;
