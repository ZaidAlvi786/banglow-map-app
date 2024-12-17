import { Injectable } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  constructor(private ngxLoader: NgxUiLoaderService) {}

  show(): void {
    this.ngxLoader.start();
  }

  hide(): void {
    this.ngxLoader.stop();
  }

  startBackground(): void {
    this.ngxLoader.startBackground('httpLoader');
  }

  stopBackground(): void {
    this.ngxLoader.stopBackground('httpLoader');
  }
}
