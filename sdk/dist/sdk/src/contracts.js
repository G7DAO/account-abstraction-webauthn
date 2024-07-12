import { Contract, ethers } from 'ethers';
import { BundlerJsonRpcProvider } from 'userop';
import ACCOUNT_ABI from '../abis/accountAbi.json';
import AVATAR_PACK_ABI from '../abis/avatarPackAbi.json';
import ENTRYPOINT_ABI from '../abis/entrypointAbi.json';
import FACTORY_ABI from '../abis/factoryAbi.json';
import EZ_TOKEN_ABI from '../abis/erc20Abi.json';
export const ENTRYPOINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
export const FACTORY_ADDRESS = '0x1240FA2A84dd9157a0e76B5Cfe98B1d52268B264'; // 0xeD4EAeBDBBA52DBB37259a2b75AbB87abF3a19E8 | '0x1c831bF4656866662B04c8FED126d432a007BD08';
export const AVATAR_PACK_ADDRESS = '0x10bb2Ee7761C2356F7D7e42311b0fDf8e5e4dCA1';
export const EZ_TOKEN_ADDRESS = '0x72788aAd0e291cDC498dd814dE76c34ae2d46a39';
export const provider = new BundlerJsonRpcProvider(
// 'https://api.stackup.sh/v1/node/de426c69f9a0021769c32376133f2bad3c563fd4b7e88d755dbf75099e0a4f68'
'https://base-sepolia.g.alchemy.com/v2/JOMsB_RG7ymuGmGM1NqlFRXuwYJ1E1Yh');
// .setBundlerRpc(
//   'https://eth-sepolia.g.alchemy.com/v2/G877AttcsdLjN_XYyon926pWginvLx9L'
// );
export const entrypointContract = new Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, provider);
export const walletFactoryContract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
export const erc721Contract = new Contract(AVATAR_PACK_ADDRESS, AVATAR_PACK_ABI, provider);
export const ezTokenContract = new Contract(EZ_TOKEN_ADDRESS, EZ_TOKEN_ABI, provider);
export const webauthnAccountAbi = new ethers.utils.Interface(ACCOUNT_ABI);
//# sourceMappingURL=contracts.js.map