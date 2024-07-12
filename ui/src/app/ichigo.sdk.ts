import {
  BundlerJsonRpcProvider,
  IUserOperation,
  Presets,
  UserOperationBuilder,
} from 'userop';
import { Contract, ethers } from 'ethers';

import erc20Abi from '../abis/erc20Abi.json';
import erc721Abi from '../abis/erc721Abi.json';
import entrypointAbi from '../abis/entrypointAbi.json';
import accountAbi from '../abis/accountAbi.json';
import walletFactoryAbi from '../abis/factoryAbi.json';

import {
  resolveAccount,
  resolveAlchemyGasAndPaymasterData,
  resolveCustomPaymasterData,
  resolveNonce,
  resolveWebAuthnSignature,
} from '../presets';

const LOGIN_URL = 'https://webauthn-server.deno.dev/login';
const webauthnAccountAbi = new ethers.utils.Interface(accountAbi);

type MinContractAbi =
  | { type: 'ERC20' }
  | { type: 'ERC721' }
  | { type: 'CUSTOM'; abi: any };

type TransferContractAbi =
  | { type: 'ERC20'; count: number }
  | { type: 'ERC721'; id: number }
  | { type: 'CUSTOM'; abi: any };

export class IchigoSDK {
  _username?: string;
  get username() {
    return this._username;
  }

  private provider: BundlerJsonRpcProvider;
  private entrypointContract: Contract;
  private walletFactoryContract: Contract;

  constructor(
    private options: {
      rpc: string;
      paymaster:
        | {
            type: 'ALCHEMY';
            rpc: string;
            policyId: string;
            preVerificationGas?: string | { percentage: number };
          }
        | {
            type: 'STACKUP';
            rpc: string;
          }
        | {
            type: 'CUSTOM';
            rpc: string;
          };

      entrypointAddress?: string;
      factoryAddress?: string;
    }
  ) {
    // set defaults
    if (this.options.paymaster.type === 'ALCHEMY') {
      this.options.paymaster.preVerificationGas ==
        this.options.paymaster.preVerificationGas || { percentage: 120 };
    }

    this.provider = new BundlerJsonRpcProvider(this.options.rpc);

    this.options.entrypointAddress =
      this.options.entrypointAddress ||
      '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

    this.options.factoryAddress =
      this.options.factoryAddress ||
      '0x1240FA2A84dd9157a0e76B5Cfe98B1d52268B264';

    this.entrypointContract = new Contract(
      this.options.entrypointAddress,
      entrypointAbi,
      this.provider
    );

    this.walletFactoryContract = new Contract(
      this.options.factoryAddress,
      walletFactoryAbi,
      this.provider
    );
  }

  async mint(
    props: {
      contractAddress: string;
      values?: any[];
      username?: string;
      statusUpdateFn?: (status: string, miniInfo?: string) => void;
    } & MinContractAbi
  ) {
    const { contractAddress, values = [], username, statusUpdateFn } = props;

    const abi =
      props.type === 'ERC721'
        ? erc721Abi
        : props.type === 'ERC20'
        ? erc20Abi
        : props.abi;

    return this.call({
      contractAddress,
      fnName: 'mint',
      values: () => values,
      username,
      abi,
      statusUpdateFn,
    });
  }

  async transfer(
    props: {
      contractAddress: string;
      toAddress: string;
      username?: string;
      statusUpdateFn?: (status: string, miniInfo?: string) => void;
    } & TransferContractAbi
  ) {
    const { contractAddress, toAddress, username, statusUpdateFn } = props;

    const abi =
      props.type === 'ERC721'
        ? erc721Abi
        : props.type === 'ERC20'
        ? erc20Abi
        : props.abi;

    const id =
      props.type === 'ERC721'
        ? props.id
        : props.type === 'ERC20'
        ? props.count
        : 0;

    return this.call({
      contractAddress,
      fnName: props.type === 'ERC20' ? 'transfer' : 'transferFrom',
      values: (walletAddress) =>
        props.type === 'ERC20'
          ? [toAddress, id]
          : [walletAddress, toAddress, id],

      username,
      abi,
      statusUpdateFn,
    });
  }

  async call(props: {
    contractAddress: string;
    fnName: string;
    values: (walletAddress: string) => any[];
    abi: any;
    username?: string;
    statusUpdateFn?: (status: string, miniInfo?: string) => void;
  }): Promise<[ethers.Event[], ethers.providers.TransactionResponse]> {
    const username = this.getUsername(props.username);

    const statusUpdateFn = props.statusUpdateFn;

    const walletAddress = await this.walletFactoryContract['getAddress'](
      username,
      0
    );
    console.log('walletAddress', walletAddress);

    statusUpdateFn?.(`Selected Paymaster: ${this.options.paymaster.type}`);

    statusUpdateFn?.(
      `Wallet address: <pre>${walletAddress}</pre>`,
      'Identified user'
    );

    const contract = new Contract(
      props.contractAddress,
      props.abi,
      this.provider
    );

    const userOpBuilder = new UserOperationBuilder()
      .useDefaults({
        sender: walletAddress,
        signature:
          '0x0000000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000032000000000000000000000000000000000000000000000000000000000000000276b09534b500ac0c94655a5b33c7e3a9eac259e59a4d9bc364fa065d3ec052f056f4e1dad27f0d51b7ba7d0851795c08b7faa5a5f173874e4e3ebd6b45646ebb1000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000000a449960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97634500000000b53976664885aa6bcebfe52262a439a20020b1e9400a0d0d9d222163b07a80c48f99af404a82572a6baf070ec660a8387f3da50102032620012158200925a64c9f41c52f20f5ba7b8201611c62b47d6b23a9027da9c5c9c444a142fb2258200767b285a7785d35532e4e6b3a3662741c3b5ad11b93ccaf3b2447afde80b5d40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f67b2274797065223a22776562617574686e2e637265617465222c226368616c6c656e6765223a225f2d5f5461514375524f744b63544757533143795a43796a414436366143686f4b363664616b396c436d73222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a34323030222c2263726f73734f726967696e223a66616c73652c226f746865725f6b6579735f63616e5f62655f61646465645f68657265223a22646f206e6f7420636f6d7061726520636c69656e74446174614a534f4e20616761696e737420612074656d706c6174652e205365652068747470733a2f2f676f6f2e676c2f796162506578227d000000000000000000000000000000000000000000000000000000000000000000000000000000000020ffefd36900ae44eb4a7131964b50b2642ca3003eba6828682bae9d6a4f650a6b00000000000000000000000000000000000000000000000000000000000001c0020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001000925a64c9f41c52f20f5ba7b8201611c62b47d6b23a9027da9c5c9c444a142fb0767b285a7785d35532e4e6b3a3662741c3b5ad11b93ccaf3b2447afde80b5d400000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000005657a656b690000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020b1e9400a0d0d9d222163b07a80c48f99af404a82572a6baf070ec660a8387f3d0000000000000000000000000000000000000000000000000000000000000041e7eb26d32f7e1573dbc2879a2525ac14c553a817c489adb777ba8feb9f6b703c5f33160f9d94b0f6b3b715cf1747f0f3599858e92bf223d47633b1c8c5ba6b471c00000000000000000000000000000000000000000000000000000000000000', // dummy signature
      })
      .useMiddleware(Presets.Middleware.getGasPrice(this.provider))
      .useMiddleware(resolveNonce(this.entrypointContract, walletAddress))
      .useMiddleware(
        resolveAccount(
          this.provider,
          this.walletFactoryContract,
          username,
          walletAddress
        )
      )

      .useMiddleware(
        this.options.paymaster.type === 'STACKUP'
          ? // >> Stackup Paymaster
            Presets.Middleware.verifyingPaymaster(this.options.paymaster.rpc, {
              type: 'payg',
            })
          : this.options.paymaster.type === 'ALCHEMY'
          ? // >> Aclhemy Paymaster
            resolveAlchemyGasAndPaymasterData(
              this.options.entrypointAddress!,
              this.options.paymaster.rpc,
              this.options.paymaster.policyId,
              { preVerificationGas: this.options.paymaster.preVerificationGas }
            )
          : // >> Custom Paymaster
            resolveCustomPaymasterData(
              this.provider,
              this.options.paymaster.rpc,
              this.options.entrypointAddress!
            )
      )

      .useMiddleware(resolveWebAuthnSignature(LOGIN_URL, username))
      .setCallData(
        webauthnAccountAbi.encodeFunctionData('execute', [
          contract.address,
          0,
          contract.interface.encodeFunctionData(
            props.fnName,
            props.values(walletAddress)
          ),
        ])
      );

    console.log({ username, walletAddress }, [
      contract.address,
      0,
      [props.fnName, props.values(walletAddress)],
    ]);

    // Build and sign userOp
    const { chainId } = await this.provider.getNetwork();

    statusUpdateFn?.(`ChainId: <pre>${chainId}</pre>`);

    statusUpdateFn?.(`Building userOp...`, 'Building userOp');

    const signedUserOp = await userOpBuilder.buildOp(
      this.options.entrypointAddress!,
      chainId
    );

    statusUpdateFn?.(
      `userOp: <pre>${JSON.stringify(signedUserOp, null, 2)}</pre>`
    );

    // Send userOp
    const receipt = await this.sendUserOp(signedUserOp, statusUpdateFn);

    await receipt.wait();

    statusUpdateFn?.(`confirmed. querying events...`, 'Confirmed');

    // console.log(receipt.hash);
    // console.log('confirmed');
    // console.log({ receipt });
    const events = await contract.queryFilter(
      contract.filters['Transfer'](ethers.constants.AddressZero, walletAddress),
      receipt.blockNumber
    );
    // console.log({ events });

    statusUpdateFn?.(
      `events: ${events.map(
        (x) => `<pre>${x.event} (from: ${x.args![0]} to: ${x.args![1]})</pre>`
      )}`
    );

    return [events, receipt];
  }

  private async sendUserOp(
    userOp: IUserOperation,
    statusUpdateFn?: (status: string, miniInfo?: string) => void
  ): Promise<ethers.providers.TransactionResponse> {
    // console.log('yo userOp', JSON.stringify(userOp));
    // console.log('yo entrypoint', entrypointContract.address);
    const userOpHash = await this.provider.send('eth_sendUserOperation', [
      userOp,
      this.options.entrypointAddress!,
    ]);

    statusUpdateFn?.(
      `userOpHash: <pre>${userOpHash}</pre> waiting for the confirmatoin...`,
      'Transaction sent'
    );

    return this.waitForUserOp(userOpHash, userOp, 20, statusUpdateFn);
  }

  private async waitForUserOp(
    userOpHash: string,
    userOp: IUserOperation,
    maxRetries = 50,
    statusUpdateFn?: (status: string, miniInfo?: string) => void
  ): Promise<ethers.providers.TransactionResponse> {
    if (maxRetries < 0) {
      throw new Error("Couldn't find the userOp broadcasted: " + userOpHash);
    }

    const lastBlock = await this.provider.getBlock('latest');
    const events = await this.entrypointContract.queryFilter(
      this.entrypointContract.filters['UserOperationEvent'](userOpHash),
      lastBlock.number - 100
    );

    statusUpdateFn?.('Checking...', 'Checking transaction on-chain');

    if (events[0]) {
      const transaction = await events[0].getTransaction();
      return transaction;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    return this.waitForUserOp(userOpHash, userOp, --maxRetries, statusUpdateFn);
  }

  private getUsername(usernameParam?: string): string {
    if (!usernameParam) throw Error('Login not set');

    const username = usernameParam
      ? usernameParam.toLowerCase()
      : this.username;

    if (!username) throw Error('Username not set');

    this._username = username;
    // Username check logic

    return username;
  }
}
