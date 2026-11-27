// Minimal NestJS-style console logger: `[Nest] <pid>  - <timestamp>     LOG [Context] message`,
// colored per level. No dependency — just ANSI escape codes.

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

const sanitizeForLog = (value: unknown): string => String(value).replace(/[\r\n\u2028\u2029]/g, '');

const redactSensitiveData = (value: string): string =>
    value.replace(
        /((?:pass(?:word)?|secret|token|api[_-]?key|authorization|client[_-]?secret|webhook[_-]?secret)\s*[:=]\s*["']?)([^"'\s,}]+)/gi,
        '$1[REDACTED]',
    );

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

const write = (level: LogLevel, message: unknown, context?: string) => {
    const stream = level === 'error' ? console.error : console.log;
    const label = `${LEVEL_COLOR[level]}${level.toUpperCase().padStart(7)}${RESET}`;
    const safeContext = context ? sanitizeForLog(context) : '';
    const safeMessage = redactSensitiveData(sanitizeForLog(message));
    const ctx = safeContext ? `${CONTEXT_COLOR}[${safeContext}]${RESET} ` : '';
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
        if (trace) console.error(redactSensitiveData(sanitizeForLog(trace)));
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
