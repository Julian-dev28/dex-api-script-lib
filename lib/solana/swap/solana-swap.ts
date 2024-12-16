import { Connection, Transaction, VersionedTransaction, Keypair, ComputeBudgetProgram } from '@solana/web3.js';
import base58 from 'bs58';
import { HmacSHA256 } from 'crypto-js';
import { enc } from 'crypto-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Constants
const TOKENS = {
    NATIVE_SOL: "11111111111111111111111111111111",
    WRAPPED_SOL: "So11111111111111111111111111111111111111112",
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
} as const;

const CONFIG = {
    MAX_RETRIES: 8,
    BASE_URL: 'https://www.okx.com',
    CHAIN_ID: '501',
    SLIPPAGE: '0.05'
} as const;

// Initialize connection
const connection = new Connection(
    `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
    {
        confirmTransactionInitialTimeout: 5000,
        wsEndpoint: `wss://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
    }
);

// Generate OKX API headers
function getHeaders(timestamp: string, method: string, path: string, query: string = ''): Record<string, string> {
    const stringToSign = timestamp + method + path + query;

    return {
        'Content-Type': 'application/json',
        'OK-ACCESS-KEY': process.env.REACT_APP_API_KEY!,
        'OK-ACCESS-SIGN': enc.Base64.stringify(
            HmacSHA256(stringToSign, process.env.REACT_APP_SECRET_KEY!)
        ),
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': process.env.REACT_APP_API_PASSPHRASE!,
        'OK-ACCESS-PROJECT': process.env.REACT_APP_PROJECT_ID!
    };
}

// Add strict parameter interface
interface SwapParams {
    chainId: string;
    amount: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    userWalletAddress: string;
    slippage: string;
}

// Updated getSwapQuote function with proper type checking
async function getSwapQuote(amount: string, fromToken: string, toToken: string) {
    if (!process.env.USER_ADDRESS) {
        throw new Error('USER_ADDRESS is required');
    }

    const params: SwapParams = {
        chainId: CONFIG.CHAIN_ID,
        amount,
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        userWalletAddress: process.env.USER_ADDRESS,
        slippage: CONFIG.SLIPPAGE
    };

    const timestamp = new Date().toISOString();
    const path = '/api/v5/dex/aggregator/swap';
    const query = '?' + new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, value.toString()])
    ).toString();

    const response = await fetch(`${CONFIG.BASE_URL}${path}${query}`, {
        method: 'GET',
        headers: getHeaders(timestamp, 'GET', path, query)
    });

    const data = await response.json();
    if (data.code !== '0' || !data.data?.[0]) {
        throw new Error(`API Error: ${data.msg || 'Unknown error'}`);
    }

    return data.data[0];
}

interface TransactionResult {
    txId: string;
    confirmation: any;
}

async function executeTransaction(txData: string, privateKey: string): Promise<TransactionResult> {
    let retryCount = 0;

    while (retryCount < CONFIG.MAX_RETRIES) {
        try {
            const recentBlockHash = await connection.getLatestBlockhash();
            const decodedTransaction = base58.decode(txData);
            let tx: Transaction | VersionedTransaction;

            try {
                tx = VersionedTransaction.deserialize(decodedTransaction);
                (tx as VersionedTransaction).message.recentBlockhash = recentBlockHash.blockhash;
            } catch {
                tx = Transaction.from(decodedTransaction);
                (tx as Transaction).recentBlockhash = recentBlockHash.blockhash;
            }

            const feePayer = Keypair.fromSecretKey(base58.decode(privateKey));

            if (tx instanceof VersionedTransaction) {
                tx.sign([feePayer]);
            } else {
                tx.partialSign(feePayer);
            }

            const txId = await connection.sendRawTransaction(tx.serialize(), {
                skipPreflight: false,
                maxRetries: 5
            });

            const confirmation = await connection.confirmTransaction({
                signature: txId,
                blockhash: recentBlockHash.blockhash,
                lastValidBlockHeight: recentBlockHash.lastValidBlockHeight
            }, 'confirmed');

            if (confirmation?.value?.err) {
                throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            }

            // Always return a defined TransactionResult
            return {
                txId,
                confirmation
            };

        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;

            if (retryCount === CONFIG.MAX_RETRIES) {
                throw error; // This will prevent undefined return
            }

            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        }
    }

    // This throw ensures the function never returns undefined
    throw new Error('Max retries exceeded');
}

// Update the swap function to handle the result properly
async function swap(amount: string, fromToken: string, toToken: string): Promise<string> {
    console.log(`Starting swap: ${amount} ${fromToken} → ${toToken}`);

    const quote = await getSwapQuote(amount, fromToken, toToken);
    console.log(`Got quote: ${quote.routerResult.toTokenAmount} output tokens`);

    // executeTransaction now guarantees a defined result
    const result = await executeTransaction(quote.tx.data, process.env.PRIVATE_KEY!);
    console.log(`Swap successful! 🎉`);
    console.log(`Transaction: https://solscan.io/tx/${result.txId}`);

    return result.txId;
}

// Execute swap
async function main() {
    try {
        // Required environment variables check
        const required = [
            'HELIUS_API_KEY',
            'PRIVATE_KEY',
            'USER_ADDRESS',
            'REACT_APP_API_KEY',
            'REACT_APP_SECRET_KEY',
            'REACT_APP_API_PASSPHRASE',
            'REACT_APP_PROJECT_ID'
        ];

        for (const env of required) {
            if (!process.env[env]) throw new Error(`Missing ${env}`);
        }

        // Execute swap (1 SOL = 1e9 lamports)
        await swap(
            '10000000',           // .001 SOL
            TOKENS.NATIVE_SOL,      // From Native SOL
            TOKENS.WRAPPED_SOL      // To Wrapped SOL
        );
    } catch (error) {
        console.error('Swap failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}