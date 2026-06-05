"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./app/routes"));
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const app = (0, express_1.default)();
// Middlewares
const allowedOrigins = [
    'http://localhost:3000',
    'https://smart-collaborate-frontend.vercel.app',
];
if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ''));
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin)
            return callback(null, true);
        // Check if the origin matches our allowed list or ends with .vercel.app
        const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
        if (isAllowed) {
            callback(null, origin);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
// API Routes
app.use('/api/v1', routes_1.default);
// Root route to check if API is alive
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Smart Project & Task Collaboration System API is running...',
    });
});
// Middlewares for unhandled routes & global error handling
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
