import { Component, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { sdk } from '../sdk';
import { AVATAR_PACK_ADDRESS } from '../contracts';

@Component({
  selector: 'app-console-demo',
  templateUrl: 'console-demo.page.html',
  styleUrls: ['console-demo.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
  ],
})
export class ConsoleDemoPage {
  @ViewChild('contentEl') private content?: IonContent;

  statusTextList = signal<string[]>([]);
  errorText = signal('');
  disabled: boolean = false;
  selectedPaymaster = 'ALCHEMY';
  followLogs = true;

  async mint(name: string) {
    this.disabled = true;
    try {
      const [events, receipt] = await sdk.mint({
        contractAddress: AVATAR_PACK_ADDRESS,
        type: 'ERC721',
        username: name,
        statusUpdateFn: (x) => {
          this.statusTextList.update((y) => [...y, x]);
          if (this.followLogs) {
            this.content?.scrollToBottom(200);
          }
        },
      });

      this.statusTextList.update((x) => [
        ...x,
        `Receipt hash: ${receipt.hash}`,
        'Completed successfully!',
      ]);

      if (this.followLogs) {
        this.content?.scrollToBottom(200);
      }
    } catch (err: any) {
      console.log(err);
      this.errorText.set(err.message);
      if (this.followLogs) {
        this.content?.scrollToBottom(200);
      }
    }
  }
}
