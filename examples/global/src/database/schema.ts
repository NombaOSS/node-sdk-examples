import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const timestamps = {
    createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
    updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
};

// `reference` is Nomba's own `transactionReference` from `initiateInflow`'s result — there's no
// caller-chosen idempotency key to key this on instead, since the SDK dedupes on an
// `idempotencyKey` that isn't echoed back in `InflowResult`.
export const inflows = sqliteTable('inflows', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    reference: text('reference').notNull().unique(),
    status: text('status').notNull().default('pending'),
    amount: integer('amount'),
    currency: text('currency'),
    phoneNumber: text('phone_number'),
    topupVendor: text('topup_vendor'),
    requestPayload: text('request_payload'),
    responsePayload: text('response_payload'),
    ...timestamps,
});

// `reference` is the idempotencyKey chosen by the caller for authorizeTransfer/authorizeExchange;
// `transactionId` is Nomba's own wtTransactionId, filled in once known (absent on a pending result,
// same caveat as BankTransferResult in examples/webhooks). `type` distinguishes a transfer row from
// an exchange row in this one shared table.
export const payouts = sqliteTable('payouts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    reference: text('reference').notNull().unique(),
    transactionId: text('transaction_id'),
    type: text('type').notNull(),
    status: text('status').notNull().default('pending'),
    amount: integer('amount'),
    sourceCurrency: text('source_currency'),
    destinationCurrency: text('destination_currency'),
    requestPayload: text('request_payload'),
    responsePayload: text('response_payload'),
    ...timestamps,
});

// One row per webhook delivery, logged regardless of whether the signature was valid or it
// matched a known payout/inflow — an audit trail independent of the `payouts`/`inflows` tables,
// and a hook point for a future processor to read unprocessed (`status = 'received'`) deliveries from.
export const webhookDeliveries = sqliteTable('webhook_deliveries', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    eventType: text('event_type'),
    transactionId: text('transaction_id'),
    signatureValid: integer('signature_valid', { mode: 'boolean' }).notNull(),
    payload: text('payload').notNull(),
    // received: logged, not yet handled. processed: handleWebhookEvent ran without error.
    // failed: handleWebhookEvent threw. rejected: signature was invalid, never handled.
    status: text('status').notNull().default('received'),
    error: text('error'),
    createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
});
