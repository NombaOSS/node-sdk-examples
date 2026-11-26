import { eq, sql } from "drizzle-orm";
import nomba from "../nomba.ts";
import {
    type AuthorizeExchangeParams,
    type AuthorizeTransferParams,
    type ConvertMoneyParams,
    type ExchangeRatesParams,
    type InstitutionProvidersParams,
    type PaymentMethodsParams,
} from "@nomba/node-sdk";
import { onSuccessHook, onPendingHook, onFailedHook } from "../../common/payout.hooks.ts";
import { db } from "../../database/client.ts";
import { payouts } from "../../database/schema.ts";

export const listAccounts = async () => {
    return nomba.globalPayout.listAccounts();
}

export const getAccount = async (accountId: string) => {
    return nomba.globalPayout.getAccount(accountId);
}

export const listSandboxAccounts = async () => {
    return nomba.globalPayout.listSandboxAccounts();
}

export const getSandboxAccount = async (accountId: string) => {
    return nomba.globalPayout.getSandboxAccount(accountId);
}

export const exchangeRates = async (params: ExchangeRatesParams) => {
    return nomba.globalPayout.exchangeRates(params);
}

export const convert = async (params: ConvertMoneyParams) => {
    return nomba.globalPayout.convert(params);
}

export const institutionProviders = async (params?: InstitutionProvidersParams) => {
    return nomba.globalPayout.institutionProviders(params);
}

export const paymentMethods = async (params?: PaymentMethodsParams) => {
    return nomba.globalPayout.paymentMethods(params);
}

export const authorizeTransfer = async (params: AuthorizeTransferParams) => {
    return nomba.globalPayout.authorizeTransfer(params, {
        onSuccess: onSuccessHook('transfer', params),
        onPending: onPendingHook('transfer', params),
        onFailed: onFailedHook('transfer', params),
    });
}

export const authorizeExchange = async (params: AuthorizeExchangeParams) => {
    return nomba.globalPayout.authorizeExchange(params, {
        onSuccess: onSuccessHook('exchange', params),
        onPending: onPendingHook('exchange', params),
        onFailed: onFailedHook('exchange', params),
    });
}

export const getPayoutTransaction = async (transactionId: string) => {
    const result = await nomba.globalPayout.getTransaction(transactionId);

    // A row created by onPendingHook may still have no transactionId (PayoutResult.wtTransactionId
    // can be absent while pending) - match on the idempotencyKey this query result carries instead,
    // when present, so that row gets found and backfilled with transactionId here. Falls back to
    // matching on transactionId itself otherwise.
    const matchOn = result.idempotencyKey ? eq(payouts.reference, result.idempotencyKey) : eq(payouts.transactionId, transactionId);

    await db
        .update(payouts)
        .set({ transactionId, status: result.status, responsePayload: JSON.stringify(result), updatedAt: sql`(current_timestamp)` })
        .where(matchOn);

    return result;
}
