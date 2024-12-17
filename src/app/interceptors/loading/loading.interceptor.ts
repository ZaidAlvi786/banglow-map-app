import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, Observable } from 'rxjs';
import { NgxUiLoaderService } from 'ngx-ui-loader';

export const LoadingInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const ngxLoader = inject(NgxUiLoaderService);
  ngxLoader.start();

  return next(req).pipe(
    finalize(() => {
      ngxLoader.stop();
    })
  );
};
