import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { enableProdMode } from '@angular/core';
import LogRocket from 'logrocket';

if (environment.production) {
    enableProdMode();
    LogRocket.init('xxhdka/bungalow'); // Replace with your actual LogRocket ID
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));