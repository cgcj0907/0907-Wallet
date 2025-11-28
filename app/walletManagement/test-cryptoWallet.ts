import { encryptWallet, decryptWallet } from './lib/cryptoWallet';
import { generateWallet } from './lib/generateWallet';



async function run() {
  const wallet = generateWallet().wallet;
  const password = 'correct-horse-battery-staple';

  console.log('Original:', wallet);
  const enc = await encryptWallet(wallet, password);
  console.log('Encrypted:', enc);

  const dec = await decryptWallet(enc, password);
  console.log('Decrypted:', dec);

  console.log('Equal:', JSON.stringify(dec) === JSON.stringify(wallet));
}

run().catch((e) => {
  console.error('Test failed:', e);
  process.exitCode = 1;
});
