import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { provideAuth } from './interceptors/auth.provider';
import { provideLoading } from './interceptors/loading/loading.provider';
import { NgxUiLoaderModule, NgxUiLoaderConfig } from 'ngx-ui-loader';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { environment } from '../environments/environment';

const config: SocketIoConfig = { url: environment.SOCKET_URL, options: {} };
const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  fgsType: 'three-strings',
  fgsColor: '#FCCA40', // Change the loader color
  pbThickness: 5, // Progress bar thickness
  bgsColor: '#20272D',
  bgsOpacity:0.7
};
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideClientHydration(),provideAuth(),provideLoading(), importProvidersFrom([ BrowserAnimationsModule,BrowserModule,
        NgxDaterangepickerMd.forRoot(),NgxUiLoaderModule.forRoot(ngxUiLoaderConfig)])]
        // , SocketIoModule.forRoot(config)
};
