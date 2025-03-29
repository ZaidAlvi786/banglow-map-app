import { Injectable, signal } from "@angular/core";
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
  private nestedPadding = new BehaviorSubject<any>(null);
  nestedPadding$ = this.nestedPadding.asObservable()
  private overlayShapeData = new BehaviorSubject<any>(null);
  overlayShapeData$ = this.overlayShapeData.asObservable()
  private drawShape = new BehaviorSubject<any>(null);
  drawShape$ = this.drawShape.asObservable()
  private vendorData = new BehaviorSubject<any>(null);
  vendorData$ = this.vendorData.asObservable()
  private groupData = new BehaviorSubject<any>(null);
  groupData$ = this.groupData.asObservable()
  private siteMarkerData = new BehaviorSubject<any>(null);
  siteMarkerData$ = this.siteMarkerData.asObservable();
  imageryData= signal<any>(null);
  imageryFilter = signal<any>(null);
  groupsData = signal<any>(null);
  libraryData = signal<any>(null);
  analyticsData = signal<any>(null);
  shapeType = signal<string>(null);
  refreshList = signal<boolean>(false);
  shapeDrawStatus = signal<boolean>(false);
  zoomed_wkt = signal<string>(null);
  libraryFilters = signal<any>(null);
  libraryColumns = signal<any>(null);
  libraryTotalCount = signal<any>(0);
  libraryZoomedCount = signal<any>(0);
  libraryFocusCount = signal<any>(0);
  libraryFilterCount = signal<any>(0);
  selectedTimeZone = signal<string>('UTC')
  timeZoneActive = signal<boolean>(false)
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

 setNestedPadding(data: any): void {
    this.nestedPadding.next(data);
}
setOverlayShapeData(data: any): void{
    this.overlayShapeData.next(data);
  }

setDrawShape(data: any): void{
  this.drawShape.next(data);
}

setVendorData(data: any): void {
  this.vendorData.next(data);
}

setGroupData(data: any): void {
  this.groupData.next(data);
}

setSiteMarkerData(data: any): void {
  this.siteMarkerData.next(data);
}

}
