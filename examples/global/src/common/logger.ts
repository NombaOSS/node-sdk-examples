// Minimal NestJS-style console logger: `[Nest] <pid>  - <timestamp>     LOG [Context] message`,
// colored per level. No dependency — just ANSI escape codes.

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

const LEVEL_COLOR: Record<LogLevel, string> = {
    log: '\x1b[32m',     // green
    error: '\x1b[31m',   // red
    warn: '\x1b[33m',    // yellow
    debug: '\x1b[35m',   // magenta
    verbose: '\x1b[36m', // cyan
};
const RESET = '\x1b[39m';
const BOLD = '\x1b[1m\x1b[39m';
const CONTEXT_COLOR = '\x1b[33m'; // yellow

const sanitizeForLog = (value: string): string => value.replace(/[\r\n]+/g, ' ').replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '');
const stringifyForLog = (value: unknown): string => sanitizeForLog(typeof value === 'string' ? value : String(value));

const sanitizeLogMessage = (message: unknown): string => {
    const raw = typeof message === 'string'
        ? message
    const safeMessage = stringifyForLog(message);
    const safeContext = context ? sanitizeForLog(context) : undefined;
    const ctx = safeContext ? `${CONTEXT_COLOR}[${safeContext}]${RESET} ` : '';
    stream(`${BOLD}[ExampleServer]${RESET} ${process.pid}  - ${new Date().toLocaleString()}     ${label} ${ctx}${safeMessage}`);
                return JSON.stringify(message);
            } catch {
                return String(message);
            }
        })();

    // Redact common sensitive key/value patterns in plain text or JSON-like logs.
    return raw.replace(
        /\b(password|passwd|pwd|secret|token|api[-_]?key|client[-_]?secret|authorization)\b\s*([:=])\s*(['"]?)[^,'"\s}]+(\3)/gi,
        '$1$2$3[REDACTED]$3',
    );
};

const write = (level: LogLevel, message: unknown, context?: string) => {
    const stream = level === 'error' ? console.error : console.log;
        if (trace) console.error(sanitizeForLog(trace));
    const ctx = context ? `${CONTEXT_COLOR}[${context}]${RESET} ` : '';
    const safeMessage = sanitizeLogMessage(message);
    stream(`${BOLD}[ExampleServer]${RESET} ${process.pid}  - ${new Date().toLocaleString()}     ${label} ${ctx}${safeMessage}`);
};

export class Logger {
    private readonly context?: string;

    constructor(context?: string) {
        this.context = context;
    }

    log(message: unknown, context: string | undefined = this.context) {
        write('log', message, context);
    }

    error(message: unknown, trace?: string, context: string | undefined = this.context) {
        write('error', message, context);
        if (trace) console.error(trace);
    }

    warn(message: unknown, context: string | undefined = this.context) {
        write('warn', message, context);
    }

    debug(message: unknown, context: string | undefined = this.context) {
        write('debug', message, context);
    }

    verbose(message: unknown, context: string | undefined = this.context) {
        write('verbose', message, context);
    }
}
