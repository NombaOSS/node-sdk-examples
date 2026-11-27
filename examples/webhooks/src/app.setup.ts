import express, { type Application, type Request as ExpressRequest, type Response, type NextFunction, type RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { returnErrorResponse } from './common/interceptor.response.ts';
import { requestLogger } from './common/request.logger.ts';
import { Logger, sanitizeForLog } from './common/logger.ts';
import * as transferController from './modules/transfer/transfer.controller.ts';
import * as webhookController from './modules/webhooks/webhook.controller.ts';

const logger = new Logger('ExceptionHandler');

const API_PREFIX = '/v1';
const WEBHOOK_PATH = '/webhooks/nomba';
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const app: Application = express();
app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser or same-origin requests that do not send Origin.
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(requestLogger);
// Must run before express.json(): verifyWebhook needs the raw bytes, not a parsed object.
app.use(`${API_PREFIX}${WEBHOOK_PATH}`, express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

// Routes go here. Kept as a plain list (not introspected from the router) so we can both
// register them and log them at boot from the same source of truth.
const routes: { method: 'get' | 'post'; path: string; handler: RequestHandler | RequestHandler[] }[] = [
    { method: 'get', path: '/transfers/banks', handler: transferController.listBanks },
    { method: 'post', path: '/transfers/lookup-bank-account', handler: transferController.lookupBankAccount },
    { method: 'post', path: '/transfers', handler: transferController.initiateTransfer },
    { method: 'get', path: '/transfers/:transferId', handler: transferController.getTransferDetails },
    { method: 'post', path: WEBHOOK_PATH, handler: webhookController.handleWebhook },
    { method: 'post', path: '/webhooks/repush', handler: webhookController.repushWebhook },
];

const v1Router = express.Router();
for (const route of routes) {
    v1Router[route.method](route.path, ...[route.handler].flat());
}
app.use(API_PREFIX, v1Router);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

export const listRoutes = () => routes.map((route) => `${route.method.toUpperCase()} ${API_PREFIX}${route.path}`);

// Fallback route
app.use((req, res) => {
    res.status(404).json({
        statusCode: 404,
        message: `Cannot ${req.method} ${req.url}`,
        error: 'Not Found',
    });
});

// Error handling middleware
app.use((err: Error, req: ExpressRequest, res: Response, next: NextFunction) => {
    const method = sanitizeForLog(req.method);
    const url = sanitizeForLog(req.url);
    const message = sanitizeForLog(err.message);
    logger.error(`${method} ${url} - ${message}`, err.stack);
    if (res.headersSent) {
        return next(err);
    }
    returnErrorResponse(res, err, req);
});

export default app;