import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1', router);

// Root route to check if API is alive
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Smart Project & Task Collaboration System API is running...',
  });
});

// Middlewares for unhandled routes & global error handling
app.use(globalErrorHandler);
app.use(notFound);

export default app;
