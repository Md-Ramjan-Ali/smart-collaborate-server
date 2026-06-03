import { RequestHandler } from 'express';

const notFound: RequestHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API Route Not Found!',
  });
};

export default notFound;
