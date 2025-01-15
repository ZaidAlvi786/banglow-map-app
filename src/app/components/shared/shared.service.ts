import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SharedService {
  private isOpenedEventCalendar = new BehaviorSubject<boolean>(false);
  isOpenedEventCalendar$ = this.isOpenedEventCalendar.asObservable();
  private updatedNestedGroup = new BehaviorSubject<any>(null);
  updatedNestedGroup$ = this.updatedNestedGroup.asObservable()
  private getNestedGroup = new BehaviorSubject<boolean>(false);
  getNestedGroup$ = this.getNestedGroup.asObservable()
  constructor() {}

  setIsOpenedEventCalendar(isOpened: boolean): void {
    this.isOpenedEventCalendar.next(isOpened);
  }

  setUpdatedNestedGroup(data: any): void{
    this.updatedNestedGroup.next(data);
  }
  setNestedGroup(data: any): void{
    this.getNestedGroup.next(data);
  }
}
