import { eq, sql } from "drizzle-orm";
import nomba from "../nomba.ts";
import { type InitiateInflowParams } from "@nomba/node-sdk";
import { db } from "../../database/client.ts";
import { inflows } from "../../database/schema.ts";

export const listProviders = async () => {
    return nomba.globalCollections.inflowProviders();
}

export const initiateInflow = async (params: InitiateInflowParams) => {
    const result = await nomba.globalCollections.initiateInflow(params);

    await db.insert(inflows).values({
        reference: result.transactionReference,
        status: result.status,
        amount: params.amount,
        currency: params.currency,
        phoneNumber: params.phoneNumber,
        topupVendor: params.topupVendor,
        requestPayload: JSON.stringify(params),
        responsePayload: JSON.stringify(result),
    });

    return result;
}

export const getInflowTransaction = async (transactionId: string) => {
    const result = await nomba.globalCollections.getTransaction(transactionId);

    // Refresh our local copy with whatever Nomba says now, if we have a row for it.
    await db
        .update(inflows)
        .set({ status: result.status, responsePayload: JSON.stringify(result), updatedAt: sql`(current_timestamp)` })
        .where(eq(inflows.reference, transactionId));

    return result;
}
