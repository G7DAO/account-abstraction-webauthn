import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ichigoSdk } from '../../app/sdk';

@Component({
  selector: 'app-ichigo-pay',
  templateUrl: 'ichigo-pay.component.html',
  styleUrls: ['ichigo-pay.component.scss'],
  standalone: true,
  imports: [FormsModule, IonicModule, CommonModule],
})
export class IchigoPayComponent {
  @Input()
  data!: PayData;

  @Input()
  totalPriceInCents = signal<number>(0);

  isPaymentInProgress: boolean = false;

  message = '';
  name: string = '';

  savedName = '';

  constructor(private activeModal: ModalController) {
    addIcons({
      'close-circle-outline': '/assets/close-circle-outline.svg',
      'finger-print-outline': '/assets/finger-print-outline.svg',
      'checkmark-circle-outline': '/assets/checkmark-circle-outline.svg',
      'shield-checkmark-outline': '/assets/shield-checkmark-outline.svg',
      'help-circle-outline': '/assets/help-circle-outline.svg',
    });

    this.savedName = localStorage.getItem('savedAccountName')!;

    if (this.savedName) {
      this.name = this.savedName;
    }

    setTimeout(() => {
      this.totalPriceInCents.set(!this.savedName ? 273 : 93);
    }, 1000);
  }

  cancel() {
    this.activeModal?.dismiss(null, 'cancel');
  }

  async confirm() {
    try {
      localStorage.setItem('savedAccountName', this.name);
      this.savedName = this.name;

      this.isPaymentInProgress = true;
      const res = this.data.erc20Mint
        ? await ichigoSdk.mintERC20(this.name, 'ALCHEMY', (_, x) => {
            if (x !== undefined) {
              this.message = x;
            }
          })
        : await ichigoSdk.mintERC721(this.name, 'ALCHEMY', (_, x) => {
            if (x !== undefined) {
              this.message = x;
            }
          });

      this.activeModal?.dismiss(
        {
          username: this.name,
          txHash: res[1].hash,
        },
        'paid'
      );
    } catch (err: any) {
      console.log(err);

      this.activeModal?.dismiss(
        {
          username: this.name,
          message: err.message,
        },
        'error'
      );
    } finally {
      this.isPaymentInProgress = false;
    }
  }
}

export type PayData = {
  networkName: string;
  networkLogoUrl: string;

  erc20Mint?: {
    name: string;
    contractAddress: string;
    count: number;

    contractLink?: string;
  };

  nftMint?: {
    name: string;
    collectionName: string;
    imageUrl: string;
    contractAddress: string;

    collectionLink?: string;
    contractLink?: string;
  };
};
