# npm run cli -- quote solana
#!/bin/bash

# Function to display usage
show_help() {
    echo "Usage: ./quote.sh [OPTION]"
    echo "Get quotes for different chains"
    echo ""
    echo "Options:"
    echo "  evm    Get quote for EVM chain"
    echo "  sui    Get quote for SUI chain" 
    echo "  ton    Get quote for TON chain"
    echo "  -h     Display this help message"
}

# Check if no arguments provided
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# Parse command line arguments
case "$1" in
    solana)
        npm run cli -- quote solana
        ;;
    evm)
        npm run cli -- quote evm
        ;;
    sui)
        npm run cli -- quote sui
        ;;
    ton)
        npm run cli -- quote ton
        ;;
    -h|--help)
        show_help
        ;;
    *)
        echo "Error: Invalid option"
        show_help
        exit 1
        ;;
esac
