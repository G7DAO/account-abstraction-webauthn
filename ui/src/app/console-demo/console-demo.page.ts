import { Component, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonicModule } from '@ionic/angular';
import { sendTransaction } from '../minting';

@Component({
  selector: 'app-console-demo',
  templateUrl: 'console-demo.page.html',
  styleUrls: ['console-demo.page.scss'],
  standalone: true,
  imports: [FormsModule, IonicModule],
})
export class ConsoleDemoPage {
  @ViewChild('contentEl') private content?: IonContent;

  statusTextList = signal<string[]>([]);
  errorText = signal('');
  disabled: boolean = false;
  selectedPaymaster = 'STACKUP';
  followLogs = true;

  async mint(name: string) {
    this.disabled = true;
    try {
      const [events, receipt] = await sendTransaction(
        name,
        this.selectedPaymaster as any,
        (x) => {
          this.statusTextList.update((y) => [...y, x]);
          if (this.followLogs) {
            this.content?.scrollToBottom(200);
          }
        }
      );

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
