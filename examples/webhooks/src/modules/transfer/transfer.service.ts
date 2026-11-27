import { eq, sql } from "drizzle-orm";
import nomba from "../nomba.ts";
import { type BankTransferParams } from "@nomba/node-sdk";
import { onSuccessHook, onPendingHook, onFailedHook } from "../../common/transfer.hooks.ts";
import { db } from "../../database/client.ts";
import { transfers } from "../../database/schema.ts";

export const listAvailableBanks = async () => {
    return await nomba.transfers.listBanks();
}

export const lookupBankAccount = async (accountNumber: string, bankCode: string) => {
    return await nomba.transfers.lookupBankAccount({
        accountNumber,
        bankCode,
    });
}

export const initiateTransfer = async (transferData: BankTransferParams) => {
    return nomba.transfers.bankTransfer(transferData, {
        onSuccess: onSuccessHook(transferData),
        onPending: onPendingHook(transferData),
        onFailed: onFailedHook(transferData),
    });
}

// No list/requery-by-merchantTxRef shortcut exists on nomba.transfers, so this goes through
// the requery service, keyed on the sessionId returned with the transfer response.
export const getTransferDetails = async (sessionId: string) => {
    const result = await nomba.requery.requeryBySession(sessionId);

    // Refresh our local copy with whatever Nomba says now, if we have a row for it.
    await db
        .update(transfers)
        .set({ responsePayload: JSON.stringify(result), updatedAt: sql`(current_timestamp)` })
        .where(eq(transfers.sessionId, sessionId));

    return result;
}
