export const LIDO_ABI = [{
  "constant": false,
  "inputs": [
    {
      "name": "_referral",
      "type": "address"
    }
  ],
  "name": "submit",
  "outputs": [
    {
      "name": "",
      "type": "uint256"
    }
  ],
  "payable": true,
  "stateMutability": "payable",
  "type": "function"
},
{
  "constant": true,
  "inputs": [],
  "name": "getTotalPooledEther",
  "outputs": [
    {
      "name": "",
      "type": "uint256"
    }
  ],
  "payable": false,
  "stateMutability": "view",
  "type": "function"
}


]as const;