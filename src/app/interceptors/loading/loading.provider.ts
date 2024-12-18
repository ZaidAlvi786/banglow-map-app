import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ENVIRONMENT_INITIALIZER, inject, EnvironmentProviders, Provider } from '@angular/core';
import { LoadingInterceptor } from './loading.interceptor';
import { NgxUiLoaderService } from 'ngx-ui-loader';

export const provideLoading = (): Array<Provider | EnvironmentProviders> => {
  return [
    provideHttpClient(withInterceptors([LoadingInterceptor])),
    {
      provide: ENVIRONMENT_INITIALIZER,
      useValue: () => inject(NgxUiLoaderService),
      multi: true,
    },
  ];
};
