import { type Request, type Response, type NextFunction } from 'express';
import { Logger, sanitizeForLog } from './logger.ts';

const logger = new Logger('HTTP');

// Logs every request once it finishes, with how long it took to respond.
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const method = sanitizeForLog(req.method);
        const originalUrl = sanitizeForLog(req.originalUrl);
        logger.log(`${method} ${originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
    });
    next();
};
