// types.ts
export type Chain = 'solana' | 'evm' | 'sui';

export interface ApiResponse<T> {
    code: string;
    msg: string;
    data: T;
}

// Define headers as a Record type with string index signature
export type HeadersConfig = {
    [key: string]: string;
}

export interface SwapQuoteParams {
    chain: Chain;
    fromToken: string;
    toToken: string;
    amount: string;
}

export interface CrossChainQuoteParams {
    fromChain: Chain;
    toChain: Chain;
    fromToken: string;
    toToken: string;
    amount: string;
}

export interface BridgeParams {
    fromChain: Chain;
    toChain: Chain;
}