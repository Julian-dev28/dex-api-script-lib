import { toNamespacedPath } from "path";

// types.ts
export type Chain = 'solana' | 'evm' | 'sui' | 'ton' | 'tron';

export interface ApiResponse<T> {
    code: string;
    msg: string;
    data: T;
}

export type HeadersConfig = {
    [key: string]: string;
}

export interface SwapQuoteParams {
    chainId: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    slippage?: string;
}

export interface CrossChainQuoteParams {
    fromChainId: string;
    toChainId: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    slippage?: string;
}

export interface BridgeParams {
    fromChainId: string;
    toChainId: string;
}

// config.ts
export const CONFIG = {
    BASE_URL: 'https://www.okx.com',
    API_VERSION: '/api/v5/dex',
    CHAIN_IDS: {
        evm: '1',
        solana: '501',
        sui: '784',
        ton: '607',
        tron: '195'
    } as const
};