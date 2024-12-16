// api.ts
import { HeadersConfig, ApiResponse, SwapQuoteParams, CrossChainQuoteParams, BridgeParams, Chain } from './types';
import { getHeaders } from './shared';
import { CONFIG } from './config';

export class OkxApi {
    private static async makeApiCall<T>(
        endpoint: string,
        method: string = 'GET',
        params: Record<string, string> = {}
    ): Promise<ApiResponse<T>> {
        const timestamp = new Date().toISOString();
        const queryString = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
        const requestPath = `${CONFIG.API_VERSION}${endpoint}`;

        const headers = getHeaders(timestamp, method, requestPath, queryString);

        try {
            const url = `${CONFIG.BASE_URL}${requestPath}${queryString}`;
            // console.log('Request URL:', url);
            // console.log('Request Headers:', headers);

            const response = await fetch(url, {
                method,
                headers
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}\n${JSON.stringify(data, null, 2)}`);
            }

            return data;
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error making API call:', error.message);
            } else {
                console.error('Error making API call:', error);
            }
            throw error;
        }
    }

    static async getSwapQuote(params: SwapQuoteParams): Promise<ApiResponse<any>> {
        return this.makeApiCall('/aggregator/quote', 'GET', {
            chainId: params.chainId,
            fromTokenAddress: params.fromTokenAddress,
            toTokenAddress: params.toTokenAddress,
            amount: params.amount,
            slippage: params.slippage || '0.1'
        });
    }

    static getChainIdFromName(chain: Chain): string {
        return CONFIG.CHAIN_IDS[chain];
    }

    static async getChainQuote(chain: Chain, amount: string): Promise<ApiResponse<any>> {
        const params: SwapQuoteParams = {
            chainId: this.getChainIdFromName(chain),
            amount,
            fromTokenAddress: '',
            toTokenAddress: '',
        };

        // Set appropriate token addresses based on chain
        switch (chain) {
            case 'evm':
                params.fromTokenAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
                params.toTokenAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
                break;
            case 'solana':
                params.fromTokenAddress = 'So11111111111111111111111111111111111111112';
                params.toTokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
                break;
            case 'sui':
                params.fromTokenAddress = '0x2::sui::SUI';
                params.toTokenAddress = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
                break;
            case 'ton':
                params.fromTokenAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
                params.toTokenAddress = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
                break;
            case 'tron':
                params.fromTokenAddress = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';
                params.toTokenAddress = 'TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT';
                break;
        }
        return this.getSwapQuote(params);
    }

    static async getBridgeTokens(params: BridgeParams): Promise<ApiResponse<any>> {
        return this.makeApiCall('/aggregator/bridge-tokens', 'GET', {
            fromChainId: params.fromChainId,
            toChainId: params.toChainId
        });
    }

    static async getBridges(params: BridgeParams): Promise<ApiResponse<any>> {
        return this.makeApiCall('/aggregator/bridges', 'GET', {
            fromChainId: params.fromChainId,
            toChainId: params.toChainId
        });
    }

    static async getCrossChainQuote(params: CrossChainQuoteParams): Promise<ApiResponse<any>> {
        return this.makeApiCall('/aggregator/cross-chain-quote', 'GET', {
            fromChainId: params.fromChainId,
            toChainId: params.toChainId,
            fromTokenAddress: params.fromTokenAddress,
            toTokenAddress: params.toTokenAddress,
            amount: params.amount,
            slippage: params.slippage || '0.1'
        });
    }
}