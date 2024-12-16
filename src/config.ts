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