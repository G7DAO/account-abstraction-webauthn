import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { sendTransaction } from './minting';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <input #nameEl placeholder="name" />
    <button (click)="call(nameEl.value)">Call!</button>
    <button (click)="alchemyMint(nameEl.value)">Alchemy Mint!</button>
  `,
})
export class AppComponent {
  call(name: string) {
    console.log(environment.bundlerRpc);
    sendTransaction(name, new Blob(['hello world'], { type: 'text/plain' }));
  }

  alchemyMint(name: string) {
    // const chain = baseGoerli;
    // const provider = new AlchemyProvider({
    //   chain,
    //   rpcUrl: environment.paymasterRpc,
    // }).withAlchemyGasManager({
    //   policyId: '32fc1986-def9-4987-8c84-2543165a143a',
    // });
    // // .connect(
    // //   (x) =>
    // //     new LightSmartContractAccount({
    // //       rpcClient: provider,
    // //       owner: signer,
    // //       chain,
    // //       entryPointAddress: getDefaultEntryPointAddress(chain),
    // //       factoryAddress: getDefaultLightAccountFactoryAddress(chain),
    // //       accountAddress: provider.getAddress(),
    // //     })
    // // );
    // provider.sendUserOperation(
    //   {
    //     target: '',
    //     data,
    //   },
    //   {}
    // );
  }
}
