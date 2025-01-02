import { Injectable } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  constructor(private ngxLoader: NgxUiLoaderService) {}

  private booleanSubject = new BehaviorSubject<boolean>(false); // Initial state
  currentValue: Observable<boolean> = this.booleanSubject.asObservable();

  setValue(value: boolean): void {
    this.booleanSubject.next(value); // Update the state
  }

  getValue(): boolean {
    return this.booleanSubject.getValue(); // Access the current value directly
  }
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
