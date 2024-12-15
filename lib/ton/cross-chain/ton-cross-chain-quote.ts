// scripts/ton-quote.ts
import { getHeaders } from '../../shared';

async function main() {
    try {
        const params = {
            fromChainId: '607', // Ton Chain ID
            toChainId: '1',    // To Ethereum
            amount: '10000000000',
            fromTokenAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // Wrapped SOL
            toTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
            slippage: '0.025', // 2.5% slippage for cross-chain swaps
            sort: '1',         // Optimal route considering all factors
        };

        const timestamp = new Date().toISOString();
        const requestPath = "/api/v5/dex/cross-chain/quote";
        const queryString = "?" + new URLSearchParams(params).toString();
        const headers = getHeaders(timestamp, "GET", requestPath, queryString);

        console.log('Getting Ton to Ton cross-chain quote...');
        const response = await fetch(`https://www.okx.com${requestPath}${queryString}`, {
            method: "GET",
            headers
        });

        const data = await response.json();
        console.log('Cross-chain quote response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

main();