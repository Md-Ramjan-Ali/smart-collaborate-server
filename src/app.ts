import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();

// Parsers
app.use(cors());
app.use(express.json());

// Application routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Smart Project & Task Collaboration System API is running...',
  });
});

export default app;
