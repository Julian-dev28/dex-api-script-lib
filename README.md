# OKX DEX Scripts

A comprehensive collection of TypeScript scripts for interacting with OKX DEX API across Ethereum (EVM), Solana, and SUI chains, supporting both standard swaps and cross-chain operations.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Obtain your project ID, API key, secret key, and passphrase from OKX Developer Portal:
https://www.okx.com/web3/build/docs/waas/introduction-to-developer-portal-interface

3. Obtain Solana RPC provider API key:
https://www.helius.dev/

4. Create `.env` file:
```env
REACT_APP_PROJECT_ID=YOUR_PROJECT_ID
REACT_APP_API_KEY=YOUR_API_KEY
REACT_APP_SECRET_KEY=YOUR_API_SECRET_KEY
REACT_APP_API_PASSPHRASE=YOUR_API_PASSPHRASE
USER_ADDRESS=YOUR_WALLET_ADDRESS
PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
HELIUS_API_KEY=YOUR_HELIUS_API_KEY
```

## Authentication Utility

The project uses a shared authentication utility (`shared.ts`) to handle OKX API authentication:

```typescript
// shared.ts
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

export function getHeaders(timestamp: string, method: string, requestPath: string, queryString = "") {
    const apiKey = process.env.REACT_APP_API_KEY;
    const secretKey = process.env.REACT_APP_SECRET_KEY;
    const apiPassphrase = process.env.REACT_APP_API_PASSPHRASE;
    const projectId = process.env.REACT_APP_PROJECT_ID;

    if (!apiKey || !secretKey || !apiPassphrase || !projectId) {
        throw new Error("Missing required environment variables");
    }

    const stringToSign = timestamp + method + requestPath + queryString;
    return {
        "Content-Type": "application/json",
        "OK-ACCESS-KEY": apiKey,
        "OK-ACCESS-SIGN": CryptoJS.enc.Base64.stringify(
            CryptoJS.HmacSHA256(stringToSign, secretKey)
        ),
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": apiPassphrase,
        "OK-ACCESS-PROJECT": projectId,
    };
}
```

### Authentication Headers

The utility generates the required authentication headers for OKX API:
- `OK-ACCESS-KEY`: Your API key
- `OK-ACCESS-SIGN`: HMAC SHA256 signature of the request
- `OK-ACCESS-TIMESTAMP`: ISO timestamp of the request
- `OK-ACCESS-PASSPHRASE`: Your API passphrase
- `OK-ACCESS-PROJECT`: Your project ID

### Usage

```typescript
const timestamp = new Date().toISOString();
const swapAPIrequestPath = "/api/v5/dex/aggregator/quote";
const crossChainAPIrequestPath = "/api/v5/dex/cross-chain/quote";
const queryString = "?" + new URLSearchParams(params).toString();
const headers = getHeaders(timestamp, "GET", requestPath, queryString);
```

## Available Scripts

### Run All Commands
```bash
npm run get-all    # Run all scripts for EVM, Solana, Sui, Ton, and Tron
```

### Solana Commands
```bash
# Individual Commands
npm run quote:solana              # Get swap quotes
npm run chain:solana              # Get chain info
npm run tokens:solana             # List supported tokens
npm run liquidity:solana          # Get liquidity info
npm run bridge-tokens:solana      # List bridge tokens
npm run bridges:solana            # Get bridge info
npm run cross-chain-quote:solana  # Get cross-chain quotes
npm run token-pairs:solana        # List token pairs

# Run All Solana Scripts
npm run all:solana
```

### EVM (Ethereum) Commands
```bash
# Individual Commands
npm run quote:evm                # Get swap quotes
npm run chain:evm                # Get chain info
npm run tokens:evm               # List supported tokens
npm run liquidity:evm           # Get liquidity info
npm run bridge-tokens:evm       # List bridge tokens
npm run bridges:evm             # Get bridge info
npm run cross-chain-quote:evm   # Get cross-chain quotes

# Run All EVM Scripts
npm run all:evm
```

### SUI Commands
```bash
# Individual Commands
npm run quote:sui               # Get swap quotes
npm run chain:sui              # Get chain info
npm run tokens:sui             # List supported tokens
npm run liquidity:sui         # Get liquidity info
npm run bridge-tokens:sui     # List bridge tokens
npm run bridges:sui           # Get bridge info
npm run cross-chain-quote:sui # Get cross-chain quotes

# Run All SUI Scripts
npm run all:sui
```

## CLI API Commands

Run the following commands in your terminal to get swap quotes for EVM, Solana, and SUI chains:

```bash
# Get default quotes
npm run cli -- quote evm
npm run cli -- quote solana
npm run cli -- quote sui
npm run cli -- quote ton
npm run cli -- quote tron

# Custom amounts
npm run cli -- quote evm -a 2000000000000000000
npm run cli -- quote solana -a 20000000000

# Custom token addresses
npm run cli -- quote evm -f 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE -t 0xdAC17F958D2ee523a2206206994597C13D831ec7 -a 1000000000000000000
```

## Directory Structure
```
lib/
├── shared.ts
├── solana/
│   ├── swap/
│   │   └── [solana swap scripts]
│   └── cross-chain/
│       └── [solana cross-chain scripts]
├── evm/
│   ├── swap/
│   │   └── [evm swap scripts]
│   └── cross-chain/
│       └── [evm cross-chain scripts]
└── sui/
    ├── swap/
    │   └── [sui swap scripts]
    └── cross-chain/
        └── [sui cross-chain scripts]
```

## Chain IDs & Common Token Addresses

### EVM (Chain ID: '1')
- Native ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
- USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

### Solana (Chain ID: '501')
- Native SOL: '11111111111111111111111111111111'
- Wrapped SOL: 'So11111111111111111111111111111111111111112'
- USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

### SUI (Chain ID: '784')
- Native SUI: '0x2::sui::SUI'
- USDC: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'

### TON (Chain ID: '607')
- Native Ton: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'
- USDC: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'

### TRON (Chain ID: '195')
- Native Tron: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'
- USDT: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'


## Security Notes
- Keep your .env file secure and never commit it to version control
- All API credentials should be treated as sensitive information
- The utility validates that all required environment variables are present before making requests

## Error Handling
All scripts include error handling and logging. Check console output for detailed information about any failures.

## Dependencies
- crypto-js: ^4.2.0
- dotenv: ^16.4.7
- ts-node: latest
- TypeScript and related dev dependencies

## License
MIT

## Contributing
Feel free to submit issues and enhancement requests.

## Support
For support, please refer to the [OKX API Documentation](https://www.okx.com/docs-v5/en/).