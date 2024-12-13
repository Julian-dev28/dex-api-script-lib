// cli.ts
import { Command } from 'commander';
import dotenv from 'dotenv';
import { getHeaders } from './shared';

dotenv.config();

const program = new Command();

// Setup CLI program
program
    .name('okx-dex')
    .description('CLI tool for interacting with OKX DEX API')
    .version('1.0.0');

// Quote command for different chains
program
    .command('quote')
    .description('Get quote for token swap')
    .argument('<chain>', 'Chain to operate on (evm, solana, sui)')
    .option('-a, --amount <amount>', 'Amount to swap')
    .option('-f, --from <address>', 'From token address (optional, uses default if not provided)')
    .option('-t, --to <address>', 'To token address (optional, uses default if not provided)')
    .action(async (chain: string, options) => {
        try {
            let params: Record<string, string> = {
                slippage: '0.1'
            };

            // Set chain-specific defaults and parameters
            switch (chain.toLowerCase()) {
                case 'evm':
                    params.chainId = '1';
                    params.amount = options.amount || '1000000000000000000'; // 1 ETH
                    params.fromTokenAddress = options.from || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // Native ETH
                    params.toTokenAddress = options.to || '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT
                    break;

                case 'solana':
                    params.chainId = '501';
                    params.amount = options.amount || '10000000000';
                    params.fromTokenAddress = options.from || 'So11111111111111111111111111111111111111112'; // Wrapped SOL
                    params.toTokenAddress = options.to || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
                    break;

                case 'sui':
                    params.chainId = '784';
                    params.amount = options.amount || '10000000000';
                    params.fromTokenAddress = options.from || '0x2::sui::SUI';
                    params.toTokenAddress = options.to || '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
                    break;

                default:
                    throw new Error('Unsupported chain. Use evm, solana, or sui');
            }

            const timestamp = new Date().toISOString();
            const requestPath = "/api/v5/dex/aggregator/quote";
            const queryString = "?" + new URLSearchParams(params).toString();
            const headers = getHeaders(timestamp, "GET", requestPath, queryString);

            console.log(`Getting ${chain.toUpperCase()} quote...`);
            const response = await fetch(`https://www.okx.com${requestPath}${queryString}`, {
                method: "GET",
                headers
            });

            const data = await response.json();
            console.log('Quote response:', JSON.stringify(data, null, 2));

        } catch (error) {
            console.error('Script failed:', error);
            process.exit(1);
        }
    });

// Parse command line arguments
program.parse();