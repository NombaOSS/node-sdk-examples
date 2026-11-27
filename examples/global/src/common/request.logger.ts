import { type Request, type Response, type NextFunction } from 'express';
import { Logger } from './logger.ts';

const logger = new Logger('HTTP');

const sanitizeForLog = (value: string): string => value.replace(/[\r\n]+/g, ' ').replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '');

// Logs every request once it finishes, with how long it took to respond.
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const safeMethod = sanitizeForLog(req.method);
        const safeOriginalUrl = sanitizeForLog(req.originalUrl);
        logger.log(`${safeMethod} ${safeOriginalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
    });
    next();
};
