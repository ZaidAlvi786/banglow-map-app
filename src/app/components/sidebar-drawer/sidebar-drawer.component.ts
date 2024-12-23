import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { LibraryComponent } from "../library/library.component";

@Component({
  selector: "app-sidebar-drawer",
  standalone: true,
  imports: [LibraryComponent],
  templateUrl: "./sidebar-drawer.component.html",
  styleUrl: "./sidebar-drawer.component.scss",
})
export class SidebarDrawerComponent implements OnInit {
  @Input() type: string = "";
  @Input() polygon_wkt:any
  @Output() closeSidebar = new EventEmitter<boolean>();
  @Output() notifyParent: EventEmitter<any> = new EventEmitter();
  @Input() endDate:any
  @Input() startDate:any
  ngOnInit(): void {
    console.log(this.polygon_wkt,'polygon_wktpolygon_wkt');
    
  }
  closeDrawer(event: boolean) {
    if (event) this.closeSidebar.emit(true);
  }
  handleData(data: any) {
    this.notifyParent.emit(data);
  }
}
