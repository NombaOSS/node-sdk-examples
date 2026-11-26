import { type WebhookEvent } from "@nomba/node-sdk";
import { eq, sql } from "drizzle-orm";
import { Logger } from "../../common/logger.ts";
import { db } from "../../database/client.ts";
import { inflows, payouts, webhookDeliveries } from "../../database/schema.ts";

const logger = new Logger('WebhookService');

// Logs every delivery — valid or not — as its own durable record, independent of whether it
// matched a known payout. A future processor could read status = 'received' rows from here
// instead of (or alongside) the inline handleWebhookEvent call below.
export const logDelivery = async (event: WebhookEvent | undefined, rawBody: string, signatureValid: boolean) => {
    const [row] = await db
        .insert(webhookDeliveries)
        .values({
            eventType: event?.event_type,
            transactionId: event?.data?.transaction?.transactionId,
            signatureValid,
            payload: rawBody,
            status: signatureValid ? 'received' : 'rejected',
        })
        .returning({ id: webhookDeliveries.id });
    return row.id;
};

export const markDeliveryProcessed = async (id: number) =>
    db.update(webhookDeliveries).set({ status: 'processed' }).where(eq(webhookDeliveries.id, id));

export const markDeliveryFailed = async (id: number, error: unknown) =>
    db.update(webhookDeliveries).set({ status: 'failed', error: String(error) }).where(eq(webhookDeliveries.id, id));

// Updates the matching local payouts row (by transactionId) if authorizeTransfer/authorizeExchange
// already inserted one. A payout webhook carries no merchant-chosen reference (unlike the bank
// transfer webhooks in examples/webhooks), so unlike those, there's nothing to fall back to and
// insert by if no row exists yet — same documented caveat as examples/payments' checkout correlation.
const upsertFromPayoutWebhook = async (event: WebhookEvent, status: string) => {
    const transactionId = event.data?.transaction?.transactionId;
    if (!transactionId) return;

    await db
        .update(payouts)
        .set({ status, responsePayload: JSON.stringify(event), updatedAt: sql`(current_timestamp)` })
        .where(eq(payouts.transactionId, transactionId));
};

// TODO: replace the logging below with more of your own business logic (notify a user, etc).
// Nomba can repush/replay events, so this stays idempotent by keying off data.transaction.transactionId.
export const handleWebhookEvent = async (event: WebhookEvent) => {
    switch (event.event_type) {
        case 'payout_success':
            logger.log(`${event.event_type} - ${event.data?.transaction?.transactionId}`);
            await upsertFromPayoutWebhook(event, 'success');
            break;
        case 'payout_refund':
            logger.log(`${event.event_type} - ${event.data?.transaction?.transactionId}`);
            await upsertFromPayoutWebhook(event, 'refunded');
            break;
        default:
            logger.log(`unhandled event_type: ${event.event_type}`);
    }
}

// The SDK documents no signature scheme for initiateInflow's per-call callbackUrl (unlike the
// nomba-signature/nomba-timestamp headers on the shared webhook subscription), and its payload
// shape isn't typed anywhere in @nomba/node-sdk — this is best-effort, not type-checked against
// an SDK type. Parse failures and unrecognized shapes are logged and swallowed, not thrown.
export const handleCollectionCallback = async (rawBody: string) => {
    let payload: Record<string, unknown>;
    try {
        payload = JSON.parse(rawBody);
    } catch (err) {
        logger.warn(`could not parse collection callback body: ${err instanceof Error ? err.message : String(err)}`);
        return;
    }

    const reference = (payload.transactionReference ?? payload.transactionId) as string | undefined;
    const status = payload.status as string | undefined;
    if (!reference) {
        logger.log(`collection callback had no transactionReference/transactionId: ${rawBody}`);
        return;
    }

    await db
        .update(inflows)
        .set({ status: status ?? 'unknown', responsePayload: rawBody, updatedAt: sql`(current_timestamp)` })
        .where(eq(inflows.reference, reference));
}
