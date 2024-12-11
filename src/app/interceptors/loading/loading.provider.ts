import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, Provider } from '@angular/core';
import { LoadingInterceptor } from './loading.interceptor';
import { LoadingService } from '../../services/loading.service';

export const provideLoading = (): Array<Provider | EnvironmentProviders> =>
{
    return [
        provideHttpClient(withInterceptors([LoadingInterceptor])),
        {
            provide : ENVIRONMENT_INITIALIZER,
            useValue: () => inject(LoadingService),
            multi   : true,
        },
    ];
};