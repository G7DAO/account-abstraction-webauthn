import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  IchigoPayComponent,
  type PayData,
} from '../../components/ichigo-pay/ichigo-pay.component';

@Component({
  selector: 'app-wallet-demo',
  templateUrl: 'wallet-demo.page.html',
  styleUrls: ['wallet-demo.page.scss'],
  standalone: true,
  imports: [FormsModule, IonicModule, IchigoPayComponent],
})
export class WalletDemoPage {
  message =
    'This modal example uses triggers to automatically open a modal when the button is clicked.';
  name: string = '';

  claimTxHash = '';

  constructor(private modal: ModalController) {
    addIcons({
      'close-circle-outline': '/assets/close-circle-outline.svg',
      'finger-print-outline': '/assets/finger-print-outline.svg',
      'checkmark-circle-outline': '/assets/checkmark-circle-outline.svg',
      'shield-checkmark-outline': '/assets/shield-checkmark-outline.svg',
      'help-circle-outline': '/assets/help-circle-outline.svg',
    });
  }

  async claim() {
    const totalPriceInCents = signal(0);

    const result = await this.modal
      .create({
        initialBreakpoint: 1,
        breakpoints: [0, 0.5, 1],
        backdropDismiss: false,
        cssClass: 'payModal',

        component: IchigoPayComponent,
        componentProps: {
          totalPriceInCents,

          data: {
            networkName: 'Sepolia',

            nftMint: {
              name: 'Purple Hat',
              collectionName: 'Game7 Avatar',
              collectionLink: 'https://gov.game7.io',
              imageUrl: '/assets/headwear2_image1.png',

              contractAddress: '0x4b3b5d4abe57eb7a00bbe9cc3ee743509b04f4e9',
              contractLink:
                'https://sepolia.etherscan.io/address/0x4b3b5d4abe57eb7a00bbe9cc3ee743509b04f4e9',
            },
          } as PayData,
        },
      })
      .then(async (x) => {
        await x.present();

        totalPriceInCents.set(2723);

        return x.onDidDismiss();
      });

    if (result.role === 'cancel') {
      return;
    }

    if (result.role === 'error') {
      alert(result.data.message);
      return;
    }

    // Success
    if (result.role === 'paid') {
      this.claimTxHash = result.data.txHash;
    }
  }
}
