import { bootstrapApplication } from '@angular/platform-browser';
import { Buffer } from 'buffer';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

window.Buffer = Buffer;

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
