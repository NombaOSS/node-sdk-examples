import * as collectionService from './collection.service.ts';
import { type Request, type Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../common/validator.request.ts';
import { returnSuccessResponse } from '../../common/interceptor.response.ts';

export const listProviders = async (req: Request, res: Response) => {
    const providers = await collectionService.listProviders();
    returnSuccessResponse(res, providers);
}

const initiateInflowRequestSchema = z.object({
    phoneNumber: z.string().min(1),
    callbackUrl: z.string().url(),
    amount: z.number().positive(),
    currency: z.string().length(3),
    topupVendor: z.string().min(1),
    idempotencyKey: z.string().min(1),
});

export const initiateInflow = [
    validateRequest(initiateInflowRequestSchema),
    async (req: Request, res: Response) => {
        const result = await collectionService.initiateInflow(req.body);
        returnSuccessResponse(res, result);
    },
];

export const getInflowTransaction = async (req: Request, res: Response) => {
    const result = await collectionService.getInflowTransaction(String(req.params.transactionId));
    returnSuccessResponse(res, result);
}
