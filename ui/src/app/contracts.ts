import { Contract, ethers } from 'ethers';

import { BundlerJsonRpcProvider } from 'userop';
import ACCOUNT_ABI from '../abis/accountAbi.json';
import AVATAR_PACK_ABI from '../abis/avatarPackAbi.json';
import ENTRYPOINT_ABI from '../abis/entrypointAbi.json';
import FACTORY_ABI from '../abis/factoryAbi.json';

export const ENTRYPOINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
export const FACTORY_ADDRESS = '0x1c831bF4656866662B04c8FED126d432a007BD08';
export const AVATAR_PACK_ADDRESS = '0x4b3b5d4abe57eb7a00bbe9cc3ee743509b04f4e9';

export const provider = new BundlerJsonRpcProvider(
  'https://ethereum-sepolia.publicnode.com'
).setBundlerRpc(
  'https://api.stackup.sh/v1/node/54fe8665d13ebc11341af214d62141289d4348a1fdbf72041e9ca1e4f06bd16b'
);

export const entrypointContract = new Contract(
  ENTRYPOINT_ADDRESS,
  ENTRYPOINT_ABI,
  provider
);

export const walletFactoryContract = new Contract(
  FACTORY_ADDRESS,
  FACTORY_ABI,
  provider
);

export const avatarPackContract = new Contract(
  AVATAR_PACK_ADDRESS,
  AVATAR_PACK_ABI,
  provider
);

export const webauthnAccountAbi = new ethers.utils.Interface(ACCOUNT_ABI);
