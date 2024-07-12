import { IchigoSDK } from 'ichigo-sdk';

export const sdk = new IchigoSDK({
  rpc: 'https://base-sepolia.g.alchemy.com/v2/JOMsB_RG7ymuGmGM1NqlFRXuwYJ1E1Yh',
  paymaster: {
    type: 'ALCHEMY',
    policyId: 'ae7829c6-25de-4150-9cc8-274d53bf209a',
    rpc: 'https://base-sepolia.g.alchemy.com/v2/JOMsB_RG7ymuGmGM1NqlFRXuwYJ1E1Yh',
  },
});

const contractAddress = '0x10bb2Ee7761C2356F7D7e42311b0fDf8e5e4dCA1'

sdk.mint({
  type: 'CUSTOM',
  contractAddress,
  abi: [],
  values: [],
})
