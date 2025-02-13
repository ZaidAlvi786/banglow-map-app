import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { LibraryComponent } from "../library/library.component";
import { SitesComponent } from "../sites/sites.component";
import { GroupsComponent } from "../groups/groups.component";
import { ImageryStatusComponent } from "../imagery-status/imagery-status.component";

@Component({
  selector: "app-sidebar-drawer",
  standalone: true,
  imports: [LibraryComponent,SitesComponent,GroupsComponent,ImageryStatusComponent],
  templateUrl: "./sidebar-drawer.component.html",
  styleUrl: "./sidebar-drawer.component.scss",
})
export class SidebarDrawerComponent implements OnInit {
  @Input() type: string = "";
  @Input() polygon_wkt:any
  @Output() closeSidebar = new EventEmitter<boolean>();
  @Output() notifyParent: EventEmitter<any> = new EventEmitter();
  @Output() addMarkerToMap: EventEmitter<any> = new EventEmitter();
  @Output() parentFilter:EventEmitter<any> = new EventEmitter();
  @Output() onFilterset: EventEmitter<any> = new EventEmitter();
  private _startDate: any;
  private _endDate: any;
  private _popUpData:any
  private _shapeHoverData:any
  @Input()
  set popUpData(value: any) {
    if (value !== this._popUpData) {
      this._popUpData = value;
      console.log('_popUpData _popUpData _popUpData:', this._popUpData);
      // Add logic to handle the updated value, e.g., update calculations or UI
    }
  }
  @Input()
  set shapeHoverData(value: any) {
    if (value !== this._popUpData) {
      this._shapeHoverData = value;
      console.log('_popUpData _popUpData _popUpData:', this._popUpData);
      // Add logic to handle the updated value, e.g., update calculations or UI
    }
  }
  get shapeHoverData(): any {
    return this._shapeHoverData;
  }
  onFiltersetData(data) {
    this.onFilterset.emit(data);
  }

  get popUpData(): any {
    return this._popUpData;
  }
  @Input()
  set startDate(value: any) {
    if (value !== this._startDate) {
      this._startDate = value;
      console.log('startDate updated:', this._startDate);
      // Add logic to handle the updated value, e.g., update calculations or UI
    }
  }

  get startDate(): any {
    return this._startDate;
  }

  @Input()
  set endDate(value: any) {
    if (value !== this._endDate) {
      this._endDate = value;
      console.log('endDate updated:', this._endDate);
      // Add logic to handle the updated value, e.g., validate the date range
    }
  }

  get endDate(): any {
    return this._endDate;
  }
  @Output() rowHoveredData: EventEmitter<any> = new EventEmitter();
  // @Input() zoomed_wkt:any ='';
  ngOnInit(): void {
    console.log(this.type,'qqqqqqqqqqqqqqqqqqqqqqqqqqqq');
    
    // console.log(this.zoomed_wkt,'polygon_wktpolygon_wkt');
    
  }

  private _zoomed_wkt: string;

@Input()
set zoomed_wkt(value: string) {
  if (value !== this._zoomed_wkt) {
    this._zoomed_wkt = value;
    console.log('zoomed_wkt updated:', this._zoomed_wkt);
    // Add logic to handle the updated value, e.g., redraw shapes
  }
  console.log('valuevaluevaluevaluevalue', value);
}

get zoomed_wkt(): string {
  return this._zoomed_wkt;
}
  closeDrawer(event: boolean) {
    if (event) this.closeSidebar.emit(true);
  }
  handleData(data: any) {
    this.notifyParent.emit(data);
  }

  handelMarkerData(data: any) {
    this.addMarkerToMap.emit(data);
  }

  highlightData(data:any){
    this.rowHoveredData.emit(data)
  }

  parentDataFilter(data:any){
    this.parentFilter.emit(data)
  }
}
