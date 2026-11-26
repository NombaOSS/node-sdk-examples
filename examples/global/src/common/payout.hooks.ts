import { type AuthorizeExchangeParams, type AuthorizeTransferParams, type FailedInfo, type PayoutResult, type PendingInfo } from "@nomba/node-sdk";
import { sql } from "drizzle-orm";
import { Logger } from "./logger.ts";
import { db } from "../database/client.ts";
import { payouts } from "../database/schema.ts";

const logger = new Logger('PayoutHooks');

type PayoutParams = AuthorizeTransferParams | AuthorizeExchangeParams;

const upsertPayout = async (
    type: 'transfer' | 'exchange',
    params: PayoutParams,
    fields: { transactionId?: string; status: string; responsePayload?: unknown },
) => {
    await db
        .insert(payouts)
        .values({
            reference: params.idempotencyKey,
            transactionId: fields.transactionId,
            type,
            status: fields.status,
            amount: params.amount,
            sourceCurrency: params.sourceCurrency,
            destinationCurrency: params.destinationCurrency,
            requestPayload: JSON.stringify(params),
            responsePayload: fields.responsePayload ? JSON.stringify(fields.responsePayload) : null,
        })
        .onConflictDoUpdate({
            target: payouts.reference,
            set: {
                transactionId: fields.transactionId,
                status: fields.status,
                responsePayload: fields.responsePayload ? JSON.stringify(fields.responsePayload) : null,
                updatedAt: sql`(current_timestamp)`,
            },
        });
};

// Persists the payout locally (src/database/schema.ts's `payouts` table) so this app has its own
// record of what it asked Nomba to do, independent of Nomba's own transaction history.
export const onSuccessHook = (type: 'transfer' | 'exchange', params: PayoutParams) => async (result: PayoutResult) => {
    logger.log(`success ${result.wtTransactionId} ${result.status}`);
    await upsertPayout(type, params, { transactionId: result.wtTransactionId, status: result.status, responsePayload: result });
    return result;
};

export const onPendingHook = (type: 'transfer' | 'exchange', params: PayoutParams) => async (info: PendingInfo<PayoutResult>) => {
    logger.log(`pending, requery later - ref: ${info.idempotencyKey} status: ${info.status}`);
    // info.data?.wtTransactionId may be absent here, same caveat as BankTransferResult in
    // examples/webhooks — captured anyway in case it's present, so a later lookup can match by it too.
    // Uppercase to match the SDK's own PayoutStatus values (result.status in onSuccessHook/
    // getPayoutTransaction) - a consistent status vocabulary across every write path.
    await upsertPayout(type, params, { transactionId: info.data?.wtTransactionId, status: 'PENDING', responsePayload: info.data });
    return info.data;
};

export const onFailedHook = (type: 'transfer' | 'exchange', params: PayoutParams) => async (info: FailedInfo<PayoutResult>) => {
    logger.warn(`failed ${info.code} - ${info.error.message}`);
    await upsertPayout(type, params, { status: 'FAILED', responsePayload: { code: info.code, message: info.error.message } });
    return undefined;
};
