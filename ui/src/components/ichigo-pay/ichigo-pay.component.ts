import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendTransaction } from 'src/app/minting';

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

  constructor(private activeModal: ModalController) {
    addIcons({
      'close-circle-outline': '/assets/close-circle-outline.svg',
      'finger-print-outline': '/assets/finger-print-outline.svg',
      'checkmark-circle-outline': '/assets/checkmark-circle-outline.svg',
      'shield-checkmark-outline': '/assets/shield-checkmark-outline.svg',
      'help-circle-outline': '/assets/help-circle-outline.svg',
    });
  }

  cancel() {
    this.activeModal?.dismiss(null, 'cancel');
  }

  async confirm() {
    try {
      this.isPaymentInProgress = true;
      const res = await sendTransaction(this.name, 'STACKUP', (_, x) => {
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

  nftMint?: {
    name: string;
    collectionName: string;
    imageUrl: string;
    contractAddress: string;

    collectionLink?: string;
    contractLink?: string;
  };
};
