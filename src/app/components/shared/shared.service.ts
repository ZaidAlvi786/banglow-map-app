import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SharedService {
  private isOpenedEventCalendar = new BehaviorSubject<boolean>(false);
  isOpenedEventCalendar$ = this.isOpenedEventCalendar.asObservable();

  constructor() {}

  setIsOpenedEventCalendar(isOpened: boolean): void {
    this.isOpenedEventCalendar.next(isOpened);
  }
}
