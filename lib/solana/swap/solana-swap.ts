import { Connection, Transaction, VersionedTransaction, Keypair, ComputeBudgetProgram } from '@solana/web3.js';
import base58 from 'bs58';
import { HmacSHA256 } from 'crypto-js';
import { enc } from 'crypto-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Types
interface SwapQuoteParams {
    chainId: string;
    amount: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    userWalletAddress: string;
    slippage: string;
}

interface SwapResponse {
    code: string;
    data: SwapData[];
    msg?: string;
}

interface SwapData {
    routerResult: {
        toTokenAmount: string;
    };
    tx: {
        data: string;
    };
}

interface TransactionResult {
    success: boolean;
    transactionId: string;
    explorerUrl: string;
    confirmation: any;
}

// Constants
const COMPUTE_UNITS = 300000;
const MAX_RETRIES = 3;
const BASE_URL = 'https://www.okx.com';
const NATIVE_SOL = "11111111111111111111111111111111";
const WRAPPED_SOL = "So11111111111111111111111111111111111111112";
const USDC_SOL = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Validate environment variables
const requiredEnvVars = [
    'HELIUS_API_KEY',
    'PRIVATE_KEY',
    'USER_ADDRESS',
    'REACT_APP_API_KEY',
    'REACT_APP_SECRET_KEY',
    'REACT_APP_API_PASSPHRASE',
    'REACT_APP_PROJECT_ID'
] as const;

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

// Initialize Solana connection
const connection = new Connection(
    `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
    {
        confirmTransactionInitialTimeout: 5000,
        wsEndpoint: `wss://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
    }
);

// Utility function to generate API headers
function generateHeaders(
    timestamp: string,
    method: string,
    requestPath: string,
    queryString: string = '',
    apiKey: string,
    secretKey: string,
    apiPassphrase: string,
    projectId: string
): Record<string, string> {
    const stringToSign = timestamp + method + requestPath + queryString;

    return {
        'Content-Type': 'application/json',
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': enc.Base64.stringify(
            HmacSHA256(stringToSign, secretKey)
        ),
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': apiPassphrase,
        'OK-ACCESS-PROJECT': projectId,
    };
}

// Get swap quote from OKX
async function getSwapQuote(
    params: SwapQuoteParams,
    apiCredentials: {
        apiKey: string;
        secretKey: string;
        apiPassphrase: string;
        projectId: string;
    }
): Promise<SwapData> {
    const timestamp = new Date().toISOString();
    const requestPath = '/api/v5/dex/aggregator/swap';
    const queryString = '?' + new URLSearchParams(Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)])
    )).toString();

    const headers = generateHeaders(
        timestamp,
        'GET',
        requestPath,
        queryString,
        apiCredentials.apiKey,
        apiCredentials.secretKey,
        apiCredentials.apiPassphrase,
        apiCredentials.projectId
    );

    const response = await fetch(`${BASE_URL}${requestPath}${queryString}`, {
        method: 'GET',
        headers,
    });

    const data = await response.json() as SwapResponse;

    if (data.code !== '0' || !data.data?.[0]) {
        throw new Error(`API Error: ${data.msg || 'Unknown error'}`);
    }

    return data.data[0];
}

// Execute the swap transaction
async function executeSwapTransaction(
    txData: SwapData,
    privateKey: string
): Promise<TransactionResult> {
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
        try {
            const transactionData = txData.tx?.data;
            if (!transactionData) {
                throw new Error('Invalid transaction data');
            }

            const recentBlockHash = await connection.getLatestBlockhash();
            const decodedTransaction = base58.decode(transactionData);
            let tx: Transaction | VersionedTransaction;

            // Try to create versioned transaction first
            try {
                tx = VersionedTransaction.deserialize(decodedTransaction);
                (tx as VersionedTransaction).message.recentBlockhash = recentBlockHash.blockhash;
            } catch (e) {
                // Fall back to legacy transaction
                tx = Transaction.from(decodedTransaction);
                (tx as Transaction).recentBlockhash = recentBlockHash.blockhash;
            }

            // Add compute budget instruction
            const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
                units: COMPUTE_UNITS
            });

            const feePayer = Keypair.fromSecretKey(base58.decode(privateKey));

            // Sign the transaction
            if (tx instanceof VersionedTransaction) {
                tx.sign([feePayer]);
            } else {
                tx.partialSign(feePayer);
            }

            // Send the transaction
            const txId = await connection.sendRawTransaction(tx.serialize(), {
                skipPreflight: false,
                maxRetries: 5
            });

            // Wait for confirmation
            const confirmation = await connection.confirmTransaction({
                signature: txId,
                blockhash: recentBlockHash.blockhash,
                lastValidBlockHeight: recentBlockHash.lastValidBlockHeight
            }, 'confirmed');

            if (confirmation?.value?.err) {
                throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            }

            return {
                success: true,
                transactionId: txId,
                explorerUrl: `https://solscan.io/tx/${txId}`,
                confirmation
            };
        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;

            if (retryCount === MAX_RETRIES) {
                throw error;
            }

            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        }
    }

    throw new Error('Max retries exceeded');
}

// Main function to execute a swap
async function executeSwap(
    amount: string,
    fromToken: string,
    toToken: string,
    userAddress: string,
    privateKey: string,
    apiCredentials: {
        apiKey: string;
        secretKey: string;
        apiPassphrase: string;
        projectId: string;
    }
): Promise<TransactionResult> {
    // Prepare swap parameters
    const swapParams: SwapQuoteParams = {
        chainId: '501', // Solana chain ID
        amount,
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        userWalletAddress: userAddress,
        slippage: '0.05',
    };

    // Get swap quote
    const swapData = await getSwapQuote(swapParams, apiCredentials);

    // Execute the transaction
    return await executeSwapTransaction(swapData, privateKey);
}

// Main execution
async function main() {
    try {
        console.log('Starting swap execution...');

        const result = await executeSwap(
            '1000000', // amount in lamports (1 SOL = 1e9 lamports)
            NATIVE_SOL, // from token (Native SOL)
            WRAPPED_SOL, // to token (Wrapped SOL)
            process.env.USER_ADDRESS!,
            process.env.PRIVATE_KEY!,
            {
                apiKey: process.env.REACT_APP_API_KEY!,
                secretKey: process.env.REACT_APP_SECRET_KEY!,
                apiPassphrase: process.env.REACT_APP_API_PASSPHRASE!,
                projectId: process.env.REACT_APP_PROJECT_ID!
            }
        );

        console.log('Swap completed successfully!');
        console.log('Transaction ID:', result.transactionId);
        console.log('Explorer URL:', result.explorerUrl);
    } catch (error) {
        console.error('Swap failed:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}