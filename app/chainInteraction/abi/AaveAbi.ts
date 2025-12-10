export const STKWATOKEN_ABI = [
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "latestAnswer",
        "outputs": [
            {
                "internalType": "int256",
                "name": "",
                "type": "int256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

export const POOL_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "asset",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "onBehalfOf",
                "type": "address"
            },
            {
                "internalType": "uint16",
                "name": "referralCode",
                "type": "uint16"
            },
            {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "permitV",
                "type": "uint8"
            },
            {
                "internalType": "bytes32",
                "name": "permitR",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "permitS",
                "type": "bytes32"
            }
        ],
        "name": "supplyWithPermit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "asset",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "onBehalfOf",
                "type": "address"
            },
            {
                "internalType": "uint16",
                "name": "referralCode",
                "type": "uint16"
            }
        ],
        "name": "supply",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }

]

export const BATCH_HELPER_ABI = [
    {
        "inputs": [
            {
                "name": "io",
                "type": "tuple",
                "components": [
                    {
                        "name": "stakeToken",
                        "type": "address"
                    },
                    {
                        "name": "edgeToken",
                        "type": "address"
                    },
                    {
                        "name": "value",
                        "type": "uint256"
                    }
                ]
            }
        ],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];