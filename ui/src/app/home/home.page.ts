import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonCard,
    IonContent,
    IonToolbar,
    IonTitle,
    IonCardHeader,
    IonCardSubtitle,
    IonCardContent,
    RouterModule,
  ],
})
export class HomePage {
  @ViewChild(IonModal) modal?: IonModal;
  isOpen = false;

  message =
    'This modal example uses triggers to automatically open a modal when the button is clicked.';
  name: string = '';

  constructor() {
    addIcons({
      'close-circle-outline': '/assets/close-circle-outline.svg',
      'finger-print-outline': '/assets/finger-print-outline.svg',
      'checkmark-circle-outline': '/assets/checkmark-circle-outline.svg',
      'shield-checkmark-outline': '/assets/shield-checkmark-outline.svg',
      'help-circle-outline': '/assets/help-circle-outline.svg',
    });
  }

  cancel() {
    this.modal?.dismiss(null, 'cancel');
    this.isOpen = false;
  }

  confirm() {
    this.modal?.dismiss(this.name, 'confirm');
  }

  onWillDismiss(event: Event) {
    this.isOpen = false;
    const ev = event as any; // as CustomEvent<OverlayEventDetail<string>>;
    console.log(ev.detail);

    if (ev.detail.role === 'confirm') {
      this.message = `Hello, ${ev.detail.data}!`;
    }
  }
}
