import { HttpEvent, HttpHandlerFn, HttpParams, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, Observable } from 'rxjs';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { LoadingService } from '../../services/loading.service';

export const LoadingInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const ngxLoader = inject(NgxUiLoaderService);
  const  mainLoader=inject(LoadingService)
  function convertHttpParamsToPlainObject(params: HttpParams): Record<string, string | string[]> {
    const paramObj: Record<string, string | string[]> = {};
    params.keys().forEach(key => {
      const values = params.getAll(key);
      // Handle null case by assigning an empty string or any default value
      paramObj[key] = values ? (values.length === 1 ? values[0] : values) : '';
    });
    return paramObj;
  }
  
  // Example usage
  const apiParams = req.params as HttpParams; // Assuming `req.params` is an HttpParams instance
  const plainParams = convertHttpParamsToPlainObject(apiParams);
  const paramString = JSON.stringify(plainParams);
  let params= JSON.stringify(req.params);
  
  if(!paramString?.includes('library') && !req.url.includes('/get-sites')){
    mainLoader.setValue(true)
    ngxLoader.startLoader('customLoader');
    ngxLoader.startLoader('buttonLoader');
   
  } else if (paramString?.includes('enableLoader')) {
    ngxLoader.startLoader('customLoader');
    mainLoader.setValue(true)
    ngxLoader.startLoader('buttonLoader');
    console.log("enableLoaderenableLoaderenableLoader");
    

  } else {
    // mainLoader.setValue(false)
  }

  return next(req).pipe(
    finalize(() => {
      if(!paramString?.includes('library')  && !req.url.includes('/get-sites')){
      ngxLoader.stopLoader('customLoader');
      ngxLoader.stopLoader('buttonLoader');
      mainLoader.setValue(false)
      } else  if (paramString?.includes('enableLoader')) {
        ngxLoader.startLoader('customLoader');
        ngxLoader.stopLoader('buttonLoader');
        console.log("enableLoaderenableLoaderenableLoader");

        mainLoader.setValue(false)
    
      }
    })
  );
};
