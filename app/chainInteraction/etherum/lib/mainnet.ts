import { WalletClient, createWalletClient, createPublicClient, http, getContract, encodePacked, hexToBigInt } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createBundlerClient, type BundlerClient, toSimple7702SmartAccount } from "viem/account-abstraction"
import { mainnet } from "viem/chains";



import { erc20Abi } from "viem";
import { signPermit } from "@/app/chainInteraction/lib/permit"



import { getPrivateKey } from "@/app/walletManagement/lib/getPrivateKey";

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY!;
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '';
const PAYMASTER_V08_ADDRESS = "0x0578cFB241215b77442a541325d6A4E6dFE700Ec";
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const CHAIN_ID = 1;

const BASE_URL =
  'https://api.etherscan.io/v2/api?' +
  `chainid=${CHAIN_ID}&module=account&apikey=${ETHERSCAN_API_KEY}`;



export async function getEthereumNormalTransactions(address: string) {
  return fetch(`${BASE_URL}&action=txlist&address=${address}&page=1000`);
}
export async function getEthereumInternalTransactions(address: string) {
  return fetch(`${BASE_URL}&action=txlistinternal&address=${address}&page=1000`);
}
export async function getEthereumERC20Transactions(address: string, contract: string) {
  return fetch(`${BASE_URL}&action=tokentx&address=${address}&contractaddress=${contract}&page=1000`);
}

export async function createEthereumWalletClient(
  keyPath: string,
  password: string
): Promise<WalletClient> {

  const privateKey = await getPrivateKey(keyPath, password) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  return createWalletClient({
    account,
    chain: mainnet,
    transport: http(
      `https://mainnet.infura.io/v3//v3/${INFURA_API_KEY}`
    ),
  });
}

export function createEthereumPublicClient() {
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(
      // `https://mainnet.infura.io/v3//v3/${INFURA_API_KEY}`
      // "https://rpc.flashbots.net"
      "https://ethereum.publicnode.com"
    )
  });
  return publicClient;
}


export async function createEthereumBundlerClient(
  keyPath: string,
  password: string
) : Promise<[BundlerClient, any, any]>{
  const client = createEthereumPublicClient();
  const privateKey = await getPrivateKey(keyPath, password) as `0x${string}`;
  const owner = privateKeyToAccount(privateKey);
  const usdc = getContract({ client, address: USDC_ADDRESS, abi: erc20Abi });
  const account = await toSimple7702SmartAccount({
    client,
    owner: owner,
  });
  const usdcBalance = await usdc.read.balanceOf([account.address]);
  if (usdcBalance < 1000000) {
    throw Error("账户余额不足");
  }
  const paymaster = {
    async getPaymasterData(parameters: any) {
      const permitAmount = 10000000n;
      const permitSignature = await signPermit({
        tokenAddress: USDC_ADDRESS,
        client,
        account: owner,
        spenderAddress: PAYMASTER_V08_ADDRESS,
        permitAmount: permitAmount,
      });

      const paymasterData = encodePacked(
        ["uint8", "address", "uint256", "bytes"],
        [0, USDC_ADDRESS, permitAmount, permitSignature],
      );

      return {
        paymaster: PAYMASTER_V08_ADDRESS as `0x${string}`,
        paymasterData,
        paymasterVerificationGasLimit: 200000n,
        paymasterPostOpGasLimit: 15000n,
        isFinal: true,
      };
    },
  };


  const bundlerClient = createBundlerClient({
    account: account,
    client,
    paymaster,
    userOperation: {
      estimateFeesPerGas: async ({ account, bundlerClient, userOperation }) => {
        const { standard: fees } = await bundlerClient.request<any>({
          method: "pimlico_getUserOperationGasPrice" as any,
        });
        const maxFeePerGas = hexToBigInt(fees.maxFeePerGas);
        const maxPriorityFeePerGas = hexToBigInt(fees.maxPriorityFeePerGas);
        return { maxFeePerGas, maxPriorityFeePerGas };
      },
    },
    transport: http(`https://public.pimlico.io/v2/${CHAIN_ID}/rpc`),
  });

  const authorization = await owner.signAuthorization({
    chainId: CHAIN_ID,
    nonce: await client.getTransactionCount({ address: owner.address }),
    contractAddress: account.authorization.address,
  });

  return [bundlerClient, account, authorization];
}
