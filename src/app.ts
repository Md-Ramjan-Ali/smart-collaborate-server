import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';

const app: Application = express();

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'https://smart-collaborate-frontend.vercel.app',
];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ''));
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Check if the origin matches our allowed list or ends with .vercel.app
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
    
    if (isAllowed) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(cookieParser());
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
