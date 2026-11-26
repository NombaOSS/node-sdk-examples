import { type Request, type Response } from 'express';
import createHttpError from 'http-errors';
const { Unauthorized } = createHttpError;
import { verifyWebhook, type WebhookEvent } from '@nomba/node-sdk';
import { NOMBA_WEBHOOK_SECRET } from '../../config/env.config.ts';
import { returnSuccessResponse } from '../../common/interceptor.response.ts';
import { Logger } from '../../common/logger.ts';
import { handleWebhookEvent, handleCollectionCallback as processCollectionCallback, logDelivery, markDeliveryProcessed, markDeliveryFailed } from './webhook.service.ts';

const logger = new Logger('Webhook');

// Mounted behind express.raw() in app.setup.ts, so req.body here is the raw Buffer
// verifyWebhook needs — by the time express.json() would run, the body is already consumed.
export const handlePayoutWebhook = async (req: Request, res: Response) => {
    const signature = req.header('nomba-signature');
    const timestamp = req.header('nomba-timestamp') ?? '';
    const rawBody = req.body as Buffer;
    const bodyText = rawBody.toString('utf-8');

    // Logged before verification too, so a rejected delivery still leaves a record of what was sent.
    logger.log(`payload: ${bodyText}`);

    const isValid = verifyWebhook(rawBody, signature, timestamp, NOMBA_WEBHOOK_SECRET);
    const event = isValid ? (JSON.parse(bodyText) as WebhookEvent) : undefined;
    const deliveryId = await logDelivery(event, bodyText, isValid);

    if (!isValid) {
        throw new Unauthorized('Invalid webhook signature');
    }

    try {
        await handleWebhookEvent(event!);
        await markDeliveryProcessed(deliveryId);
    } catch (err) {
        await markDeliveryFailed(deliveryId, err);
        throw err;
    }

    returnSuccessResponse(res, { received: true });
}

// initiateInflow's own callbackUrl, not the shared nomba-signature-verified webhook subscription —
// the SDK documents no signature scheme for it, so there's nothing to verify here. Also mounted
// behind express.raw() (see app.setup.ts) purely for consistency with handlePayoutWebhook, even
// though nothing here needs the raw bytes specifically.
export const handleCollectionCallback = async (req: Request, res: Response) => {
    const rawBody = req.body as Buffer;
    const bodyText = rawBody.toString('utf-8');

    logger.log(`collection callback payload: ${bodyText}`);

    // signatureValid: false here means exactly that — nothing about this request was verified,
    // so the audit column stays honest. webhook.service.ts's handleCollectionCallback never trusts
    // this body for the actual status; it only pulls a reference out of it to requery.
    const deliveryId = await logDelivery(undefined, bodyText, false);

    try {
        await processCollectionCallback(bodyText);
        await markDeliveryProcessed(deliveryId);
    } catch (err) {
        await markDeliveryFailed(deliveryId, err);
        throw err;
    }

    returnSuccessResponse(res, { received: true });
}
