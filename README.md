# OKX DEX Scripts

A comprehensive collection of TypeScript scripts for interacting with OKX DEX API across Ethereum (EVM), Solana, and SUI chains, supporting both standard swaps and cross-chain operations.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
REACT_APP_API_KEY=your_api_key
REACT_APP_SECRET_KEY=your_secret_key
REACT_APP_API_PASSPHRASE=your_passphrase
REACT_APP_PROJECT_ID=your_project_id
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
npm run get-all    # Run all scripts for Solana, EVM, and SUI
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

## Security Notes
- Keep your .env file secure and never commit it to version control
- All API credentials should be treated as sensitive information
- The utility validates that all required environment variables are present before making requests

## Error Handling
All scripts include error handling and logging. Check console output for detailed information about any failures.

## Dependencies
- crypto-js: ^4.2.0
- dotenv: ^16.4.7
- TypeScript and related dev dependencies

## License
MIT

## Contributing
Feel free to submit issues and enhancement requests.

## Support
For support, please refer to the [OKX API Documentation](https://www.okx.com/docs-v5/en/).