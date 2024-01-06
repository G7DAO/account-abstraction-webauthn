import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { sendTransaction } from './minting';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  styleUrl: `./app.component.scss`,
  template: `
    <input #nameEl placeholder="Please enter unique username" />

    <select [value]="selectedPaymaster" (change)="onPaymasterChange($event)">
      <option value="STACKUP">Paymaster: Stackup</option>
      <option value="ALCHEMY">Paymaster: Alchemy</option>
    </select>

    <button (click)="mint(nameEl.value)" [disabled]="disabled">
      Create Account and Mint NFT
    </button>

    <div>
      <br />
      <ul>
        <li *ngFor="let item of statusTextList()" [innerHTML]="item"></li>
      </ul>

      @if (errorText()) {
      <span class="error">{{ errorText() }}</span>
      }
    </div>
  `,
})
export class AppComponent {
  statusTextList = signal<string[]>([]);
  errorText = signal('');
  disabled: boolean = false;
  selectedPaymaster = 'STACKUP';

  async mint(name: string) {
    this.disabled = true;
    try {
      const [events, receipt] = await sendTransaction(
        name,
        this.selectedPaymaster as any,
        (x) => this.statusTextList.update((y) => [...y, x])
      );

      this.statusTextList.update((x) => [
        ...x,
        `Receipt hash: ${receipt.hash}`,
        'Completed successfully!',
      ]);
    } catch (err: any) {
      console.log(err);
      this.errorText.set(err.message);
    }
  }

  onPaymasterChange(x: any) {
    const res = x.srcElement.options[x.srcElement.selectedIndex].value;
    this.selectedPaymaster = res;
  }
}
