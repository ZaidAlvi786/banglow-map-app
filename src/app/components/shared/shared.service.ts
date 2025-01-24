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
  private rowHover = new BehaviorSubject<any>(null);
  rowHover$ = this.rowHover.asObservable()
  private rightMenuHide = new BehaviorSubject<any>(false);
  rightMenuHide$ = this.rightMenuHide.asObservable()
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
  setRowHover(data: any): void{
    this.rowHover.next(data);
  }
  setRightMenuHide(data: any): void{
    this.rightMenuHide.next(data);
  }
}
