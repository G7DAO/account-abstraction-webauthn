import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ModalController, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  IchigoPayComponent,
  type PayData,
} from '../../components/ichigo-pay/ichigo-pay.component';
import { avatarPackContract, walletFactoryContract } from '../contracts';
import { ichigoSdk } from '../sdk';

@Component({
  selector: 'app-wallet-demo',
  templateUrl: 'wallet-demo.page.html',
  styleUrls: ['wallet-demo.page.scss'],
  standalone: true,
  imports: [IonSpinner,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonBackButton,
    IonContent,
    IonTitle,
    IonCard,
    IonCardContent,
    IonIcon,
    IchigoPayComponent,
  ],
})
export class WalletDemoPage {
  message =
    'This modal example uses triggers to automatically open a modal when the button is clicked.';
  name: string = '';

  claimTxHash = '';
  savedName = '';
  savedUserAddress = '';
  ownedTokenIds: number[] = [];
  transferingTokenId = 0;

  constructor(private modal: ModalController, private alert: AlertController) {
    addIcons({
      'close-circle-outline': '/assets/close-circle-outline.svg',
      'finger-print-outline': '/assets/finger-print-outline.svg',
      'checkmark-circle-outline': '/assets/checkmark-circle-outline.svg',
      'shield-checkmark-outline': '/assets/shield-checkmark-outline.svg',
      'help-circle-outline': '/assets/help-circle-outline.svg',
    });
  }

  async ngOnInit() {
    this.savedName = localStorage.getItem('savedAccountName')!;

    if (this.savedName) {
      this.savedUserAddress = await this.getUserAddress(this.savedName);
      this.ownedTokenIds = await this.loadOwnedNFTs(this.savedUserAddress);
    }
  }

  async signIn() {
    const alert = await this.alert.create({
      header: 'Select User',
      inputs: [{ name: 'username', placeholder: 'username' }],
      buttons: [{ text: 'Find' }],
    });
    alert.present();

    const res = await alert.onDidDismiss();

    const username = res.data?.values?.username;
    console.log({ username });

    this.savedUserAddress = await this.getUserAddress(username);
    console.log({ walletAddress: this.savedUserAddress });

    if (this.savedUserAddress) {
      this.savedName = username;
      localStorage.setItem('savedAccountName', username);

      this.ownedTokenIds = await this.loadOwnedNFTs(this.savedUserAddress);
    }
  }

  signOut() {
    localStorage.removeItem('savedAccountName');
    this.savedName = '';
  }

  async transfer(item: number) {
    const alert = await this.alert.create({
      header: `Transfer token #${item} to`,
      inputs: [{ name: 'toAddress', placeholder: 'walletAddress' }],
      buttons: [{ text: 'Send' }],
    });
    alert.present();

    const res = await alert.onDidDismiss();

    const toAddress = res.data?.values?.toAddress;
    console.log({ toAddress, item });

    this.transferingTokenId = item;
    const transferRes = await ichigoSdk
      .transferNFT(
        this.savedUserAddress,
        this.savedName,
        toAddress,
        Number(item),
        'ALCHEMY',
        () => {}
      )
      .finally(() => (this.transferingTokenId = 0));

    console.log(transferRes);

    this.ownedTokenIds = await this.loadOwnedNFTs(this.savedUserAddress);
  }

  openTokenDetails(item: number) {
    window.open(
      `https://sepolia.basescan.org/token/0x10bb2ee7761c2356f7d7e42311b0fdf8e5e4dca1?a=${item}#inventory`
    );
  }

  async claim() {
    try {
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
                  'https://sepolia.basescan.org/address/0x4b3b5d4abe57eb7a00bbe9cc3ee743509b04f4e9',
              },
            } as PayData,
          },
        })
        .then(async (x) => {
          await x.present();

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
    } finally {
      this.savedName = localStorage.getItem('savedAccountName')!;

      if (this.savedName) {
        this.savedUserAddress = await this.getUserAddress(this.savedName);
        this.ownedTokenIds = await this.loadOwnedNFTs(this.savedUserAddress);
      }
    }
  }

  async getUserAddress(username: string) {
    const res = await walletFactoryContract.callStatic['getAddress'](
      username.toLowerCase(),
      0
    );
    console.log('getAddress', res);
    return res;
  }

  async loadOwnedNFTs(walletAddress: string) {
    const res = await avatarPackContract.callStatic['userTokens'](
      walletAddress
    );
    console.log('userTokens', res);
    return res;
  }

  async refreshData() {
    this.savedName = localStorage.getItem('savedAccountName')!;
    this.ownedTokenIds = [];
    this.savedUserAddress = '';

    if (this.savedName) {
      this.savedUserAddress = await this.getUserAddress(this.savedName);
      this.ownedTokenIds = await this.loadOwnedNFTs(this.savedUserAddress);
    }
  }
}
