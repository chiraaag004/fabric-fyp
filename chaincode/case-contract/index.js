'use strict';

const { Contract } = require('fabric-contract-api');

class CaseContract extends Contract {

    async initLedger(ctx) {
        // No-op
    }

    async createCase(ctx, caseId, description) {
        const exists = await this.caseExists(ctx, caseId);
        if (exists) {
            throw new Error(`The case ${caseId} already exists`);
        }

        // Deterministic Timestamp (Critical for consensus)
        const txTime = ctx.stub.getTxTimestamp();
        const timestamp = new Date(txTime.seconds * 1000).toISOString();
        const submitter = ctx.clientIdentity.getMSPID();

        const asset = {
            caseId,
            description,
            timestamp,
            currentCustodian: submitter,
            status: 'OPEN',
            evidenceList: [],
            docType: 'case',
        };

        await ctx.stub.putState(caseId, Buffer.from(JSON.stringify(asset)));
        return JSON.stringify(asset);
    }

    async addEvidence(ctx, caseId, evidenceHash) {
        const assetAsBytes = await ctx.stub.getState(caseId);
        if (!assetAsBytes || assetAsBytes.length === 0) {
            throw new Error(`${caseId} does not exist`);
        }
        
        const asset = JSON.parse(assetAsBytes.toString());
        asset.evidenceList.push(evidenceHash);

        await ctx.stub.putState(caseId, Buffer.from(JSON.stringify(asset)));
        return JSON.stringify(asset);
    }

    async transferCustody(ctx, caseId, newOwner) {
        const assetAsBytes = await ctx.stub.getState(caseId);
        if (!assetAsBytes || assetAsBytes.length === 0) {
            throw new Error(`${caseId} does not exist`);
        }
        
        const asset = JSON.parse(assetAsBytes.toString());
        asset.currentCustodian = newOwner;
        
        await ctx.stub.putState(caseId, Buffer.from(JSON.stringify(asset)));
        return JSON.stringify(asset);
    }

    async getCaseHistory(ctx, caseId) {
        const iterator = await ctx.stub.getHistoryForKey(caseId);
        const allResults = [];
        
        while (true) {
            const res = await iterator.next();
            if (res.value) {
                let record;
                try {
                    record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    record = res.value.value.toString('utf8');
                }
                allResults.push({
                    txId: res.value.txId,
                    timestamp: res.value.timestamp,
                    record: record
                });
            }
            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults);
            }
        }
    }

    async caseExists(ctx, caseId) {
        const caseJSON = await ctx.stub.getState(caseId);
        return caseJSON && caseJSON.length > 0;
    }
}

// --- CRITICAL FIX: EXPORT AS ARRAY ---
module.exports.CaseContract = CaseContract;
module.exports.contracts = [ CaseContract ];