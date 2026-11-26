import * as payoutService from './payout.service.ts';
import { type Request, type Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../common/validator.request.ts';
import { returnSuccessResponse } from '../../common/interceptor.response.ts';

export const listAccounts = async (req: Request, res: Response) => {
    const accounts = await payoutService.listAccounts();
    returnSuccessResponse(res, accounts);
}

export const getAccount = async (req: Request, res: Response) => {
    const account = await payoutService.getAccount(String(req.params.accountId));
    returnSuccessResponse(res, account);
}

export const listSandboxAccounts = async (req: Request, res: Response) => {
    const accounts = await payoutService.listSandboxAccounts();
    returnSuccessResponse(res, accounts);
}

export const getSandboxAccount = async (req: Request, res: Response) => {
    const account = await payoutService.getSandboxAccount(String(req.params.accountId));
    returnSuccessResponse(res, account);
}

const exchangeRatesRequestSchema = z.object({
    from: z.string().length(3),
    to: z.string().length(3),
    region: z.string().optional(),
});

export const exchangeRates = async (req: Request, res: Response) => {
    const params = exchangeRatesRequestSchema.parse(req.query);
    const rates = await payoutService.exchangeRates(params);
    returnSuccessResponse(res, rates);
}

const convertRequestSchema = z.object({
    amount: z.number().positive(),
    currency: z.string().length(3),
    destinationCurrency: z.string().length(3),
    transactionType: z.string().min(1),
});

export const convert = [
    validateRequest(convertRequestSchema),
    async (req: Request, res: Response) => {
        const result = await payoutService.convert(req.body);
        returnSuccessResponse(res, result);
    },
];

const institutionProvidersRequestSchema = z.object({
    isMobileMoney: z.coerce.boolean().optional(),
    countryIsoCode: z.string().optional(),
});

export const institutionProviders = async (req: Request, res: Response) => {
    const params = institutionProvidersRequestSchema.parse(req.query);
    const providers = await payoutService.institutionProviders(params);
    returnSuccessResponse(res, providers);
}

const paymentMethodsRequestSchema = z.object({
    destinationCountryIsoCode: z.string().optional(),
    destinationCurrency: z.string().optional(),
    code: z.string().optional(),
    name: z.string().optional(),
});

export const paymentMethods = async (req: Request, res: Response) => {
    const params = paymentMethodsRequestSchema.parse(req.query);
    const methods = await payoutService.paymentMethods(params);
    returnSuccessResponse(res, methods);
}

const PAYMENT_METHODS = ["BANK", "MobileMoney", "INTERAC", "FASTER_PAYMENTS", "SEPA", "ACH", "WIRE"] as const;

const authorizeTransferRequestSchema = z.object({
    idempotencyKey: z.string().min(1),
    amount: z.number().positive(),
    sourceCurrency: z.string().length(3),
    destinationCurrency: z.string().length(3),
    receiverName: z.string().min(1),
    sourceCountryIsoCode: z.string().length(2),
    destinationCountryIsoCode: z.string().length(2),
    paymentMethod: z.enum(PAYMENT_METHODS),
    accountType: z.enum(['INDIVIDUAL', 'CORPORATE']),
    accountNumber: z.string().optional(),
    institutionCode: z.string().optional(),
    institutionName: z.string().optional(),
    bankAccountType: z.enum(['CHECKING', 'SAVINGS']).optional(),
    purposeOfPayment: z.string().optional(),
    narration: z.string().optional(),
    lockedExchangeRateId: z.string().optional(),
    bankAddress: z.string().optional(),
    bankCity: z.string().optional(),
    bankState: z.string().optional(),
    bankZipCode: z.string().optional(),
    beneficiary: z.object({
        beneficiaryEmail: z.string().email().optional(),
        securityQuestion: z.string().optional(),
        securityQuestionAnswer: z.string().optional(),
        transitNumber: z.string().optional(),
        beneficiaryAddress: z.string().optional(),
        beneficiaryCity: z.string().optional(),
        beneficiaryState: z.string().optional(),
        beneficiaryPostCode: z.string().optional(),
    }).optional(),
});

export const authorizeTransfer = [
    validateRequest(authorizeTransferRequestSchema),
    async (req: Request, res: Response) => {
        const result = await payoutService.authorizeTransfer(req.body);
        returnSuccessResponse(res, result);
    },
];

const authorizeExchangeRequestSchema = z.object({
    idempotencyKey: z.string().min(1),
    amount: z.number().positive(),
    sourceCurrency: z.string().length(3),
    destinationCurrency: z.string().length(3),
    senderName: z.string().min(1),
    receiverName: z.string().min(1),
    sourceCountryIsoCode: z.string().length(2),
    destinationCountryIsoCode: z.string().length(2),
    narration: z.string().optional(),
    lockedExchangeRateId: z.string().optional(),
});

export const authorizeExchange = [
    validateRequest(authorizeExchangeRequestSchema),
    async (req: Request, res: Response) => {
        const result = await payoutService.authorizeExchange(req.body);
        returnSuccessResponse(res, result);
    },
];

export const getPayoutTransaction = async (req: Request, res: Response) => {
    const result = await payoutService.getPayoutTransaction(String(req.params.transactionId));
    returnSuccessResponse(res, result);
}
