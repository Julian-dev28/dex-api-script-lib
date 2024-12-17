import { Command } from 'commander';
import dotenv from 'dotenv';
import { getHeaders } from './shared';
import chalk from 'chalk';

dotenv.config();

const program = new Command();

interface TokenDetail {
    decimal: string;
    isHoneyPot: boolean;
    taxRate: string;
    tokenContractAddress: string;
    tokenSymbol: string;
    tokenUnitPrice: string;
}

interface QuoteCompare {
    amountOut: string;
    dexLogo: string;
    dexName: string;
    tradeFee: string;
}

interface QuoteResponseData {
    chainId: string;
    estimateGasFee: string;
    fromToken: TokenDetail;
    toToken: TokenDetail;
    fromTokenAmount: string;
    toTokenAmount: string;
    priceImpactPercentage: string;
    tradeFee: string;
    quoteCompareList: QuoteCompare[];
}

interface QuoteResponse {
    code: string;
    data: QuoteResponseData[];
    msg: string;
}

function formatAmount(amount: string, decimals: number): string {
    try {
        const value = BigInt(amount);
        const divisor = BigInt(10 ** decimals);
        const integerPart = value / divisor;
        const fractionalPart = value % divisor;
        return Number(integerPart + fractionalPart * BigInt(100) / divisor / BigInt(100))
            .toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6
            });
    } catch (error) {
        return amount;
    }
}

function formatFee(fee: string): string {
    const feeNum = Number(fee);
    // For very small numbers, show as regular decimal instead of scientific
    if (feeNum < 0.0001) {
        return feeNum.toFixed(8);
    }
    return feeNum.toFixed(6);
}

function formatPrice(price: string): string {
    return Number(price).toFixed(2);
}


function formatDollarValue(value: number): string {
    if (value < 0.01) {
        return value.toFixed(8);
    }
    return value.toFixed(2);
}

function formatQuoteResponse(data: QuoteResponse) {
    if (data.code !== '0') {
        console.log(chalk.red(`❌ Error: ${data.msg}`));
        return;
    }

    if (!data.data?.[0]) {
        console.log(chalk.yellow('⚠️ No quote data available'));
        return;
    }

    const quote = data.data[0];
    console.log(chalk.bold('\n🔄 Swap Quote Summary\n'));

    // From Token
    console.log(chalk.cyan('📤 From Token:'));
    console.log(`  Symbol: ${chalk.green(quote.fromToken.tokenSymbol)}`);
    console.log(`  Amount: ${chalk.yellow(formatAmount(quote.fromTokenAmount, parseInt(quote.fromToken.decimal)))} ${quote.fromToken.tokenSymbol}`);
    console.log(`  Price: $${chalk.green(Number(quote.fromToken.tokenUnitPrice).toFixed(2))}`);
    console.log(`  Address: ${chalk.dim(quote.fromToken.tokenContractAddress)}`);

    // To Token
    console.log(chalk.cyan('\n📥 To Token:'));
    console.log(`  Symbol: ${chalk.green(quote.toToken.tokenSymbol)}`);
    console.log(`  Amount: ${chalk.yellow(formatAmount(quote.toTokenAmount, parseInt(quote.toToken.decimal)))} ${quote.toToken.tokenSymbol}`);
    console.log(`  Price: $${chalk.green(Number(quote.toToken.tokenUnitPrice).toFixed(2))}`);
    console.log(`  Address: ${chalk.dim(quote.toToken.tokenContractAddress)}`);

    // Exchange Details with fee validation
    console.log(chalk.cyan('\n💱 Exchange Details:'));
    console.log(`  Price Impact: ${chalk.yellow(quote.priceImpactPercentage)}%`);
    const tradeFeeUSD = Number(quote.tradeFee) * Number(quote.fromToken.tokenUnitPrice);
    console.log(`  Trade Fee: ${chalk.yellow(formatFee(quote.tradeFee))} ${quote.fromToken.tokenSymbol} ($${formatDollarValue(tradeFeeUSD)})`);

    if (tradeFeeUSD > 20) {  // Warning for high fees
        console.log(chalk.yellow('  ⚠️  Fee seems high - consider checking individual DEX fees below'));
    }

    console.log(`  Estimated Gas: ${chalk.yellow(Number(quote.estimateGasFee).toLocaleString())} gas units`);

    // Route Comparison with cleaner fee formatting
    if (quote.quoteCompareList && quote.quoteCompareList.length > 0) {
        console.log(chalk.cyan('\n🏆 Best Routes by DEX:'));
        quote.quoteCompareList
            .sort((a, b) => Number(b.amountOut) - Number(a.amountOut))
            .forEach((route, index) => {
                const prefix = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
                const amountOut = Number(route.amountOut).toFixed(2);
                const feeDollarValue = Number(route.tradeFee) * Number(quote.fromToken.tokenUnitPrice);

                console.log(`  ${prefix} ${chalk.bold(route.dexName)}`);
                console.log(`     Amount Out: ${chalk.green(amountOut)} ${quote.toToken.tokenSymbol}`);
                console.log(`     Fee: ${chalk.yellow(formatFee(route.tradeFee))} ${quote.fromToken.tokenSymbol} ($${feeDollarValue.toFixed(6)})`);

                if (index > 0) {
                    const bestRate = Number(quote.quoteCompareList[0].amountOut);
                    const currentRate = Number(route.amountOut);
                    const difference = ((bestRate - currentRate) / bestRate) * 100;
                    if (difference > 0.01) {
                        console.log(`     Difference from best: ${chalk.red(`-${difference.toFixed(3)}%`)}`);
                    }
                }
            });
    }

    // Enhanced Summary with more details
    console.log(chalk.cyan('\n📊 Summary:'));
    const exchangeRate = (Number(quote.toTokenAmount) / (10 ** parseInt(quote.toToken.decimal))) /
        (Number(quote.fromTokenAmount) / (10 ** parseInt(quote.fromToken.decimal)));

    const wsolPrice = Number(quote.fromToken.tokenUnitPrice);
    console.log(`  1 ${quote.fromToken.tokenSymbol} = ${chalk.green(exchangeRate.toFixed(2))} ${quote.toToken.tokenSymbol} ($${wsolPrice.toFixed(2)})`);

    const totalValue = Number(quote.toTokenAmount) / (10 ** parseInt(quote.toToken.decimal));
    console.log(`  Total Value: ${chalk.green('$' + totalValue.toFixed(2))}`);

    // Add effective rate
    const effectiveRate = (totalValue / 10).toFixed(2);  // 10 is the input amount
    console.log(`  Effective Rate: ${chalk.green('$' + effectiveRate)} per ${quote.fromToken.tokenSymbol}`);

    if (wsolPrice - Number(effectiveRate) > 1) {
        console.log(chalk.yellow(`  Note: Effective rate is ${(wsolPrice - Number(effectiveRate)).toFixed(2)} lower than market price`));
    }

    console.log('\n' + chalk.dim('───────────────────────────────────────'));
}

program
    .name('okx-dex')
    .description('CLI tool for interacting with OKX DEX API')
    .version('1.0.0');

program
    .command('quote')
    .description('Get quote for token swap')
    .argument('<chain>', 'Chain to operate on (evm, solana, sui)')
    .option('-a, --amount <amount>', 'Amount to swap')
    .option('-f, --from <address>', 'From token address (optional, uses default if not provided)')
    .option('-t, --to <address>', 'To token address (optional, uses default if not provided)')
    .action(async (chain: string, options) => {
        try {
            const params: Record<string, string> = {
                chainId: '',
                amount: '',
                fromTokenAddress: '',
                toTokenAddress: '',
                slippage: '0.1'
            };

            // Set chain-specific defaults and parameters
            switch (chain.toLowerCase()) {
                case 'evm':
                    params.chainId = '1';
                    params.amount = options.amount || '10000000000000000000';
                    params.fromTokenAddress = options.from || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
                    params.toTokenAddress = options.to || '0xdAC17F958D2ee523a2206206994597C13D831ec7';
                    break;

                case 'solana':
                    params.chainId = '501';
                    params.amount = options.amount || '10000000000';
                    params.fromTokenAddress = options.from || 'So11111111111111111111111111111111111111112';
                    params.toTokenAddress = options.to || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
                    break;

                case 'sui':
                    params.chainId = '784';
                    params.amount = options.amount || '10000000000';
                    params.fromTokenAddress = options.from || '0x2::sui::SUI';
                    params.toTokenAddress = options.to || '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
                    break;

                case 'ton':
                    params.chainId = '607';
                    params.amount = options.amount || '10000000000';
                    params.fromTokenAddress = options.from || 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
                    params.toTokenAddress = options.to || 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
                    break;

                case 'tron':
                    params.chainId = '195';
                    params.amount = options.amount || '10000000000';
                    params.fromTokenAddress = options.from || 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';
                    params.toTokenAddress = options.to || 'TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT';
                    break;

                default:
                    throw new Error('Unsupported chain. Use evm, solana, or sui');
            }

            const timestamp = new Date().toISOString();
            const requestPath = "/api/v5/dex/aggregator/quote";
            const queryString = "?" + new URLSearchParams(params).toString();
            const headers = getHeaders(timestamp, "GET", requestPath, queryString);

            console.log(`\n🔍 Getting ${chain.toUpperCase()} quote...\n`);
            // console.log(chalk.dim('Request URL:', `${requestPath}${queryString}`));
            // console.log(chalk.dim('Headers:', JSON.stringify(headers, null, 2)));

            const response = await fetch(`https://www.okx.com${requestPath}${queryString}`, {
                method: "GET",
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Debug log
            // console.log(chalk.dim('\nAPI Response:', JSON.stringify(data, null, 2)));
            formatQuoteResponse(data);

        } catch (error) {
            console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
            process.exit(1);
        }
    });

program.parse();