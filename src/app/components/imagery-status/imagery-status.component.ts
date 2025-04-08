import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { SatelliteService } from "../../services/satellite.service";
import { SharedService } from "../shared/shared.service";
import { CommonModule } from "@angular/common";
import { MatCheckboxModule } from "@angular/material/checkbox";
import momentZone from "moment-timezone";
import { OverlayContainer } from "@angular/cdk/overlay";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { DaterangepickerDirective, NgxDaterangepickerMd } from "ngx-daterangepicker-material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { animate, state, style, transition, trigger } from "@angular/animations";
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import { UtcDateTimePipe } from "../../pipes/date-format.pipe";
import { CommonDailogsComponent } from "../../dailogs/common-dailogs/common-dailogs.component";
import { MatDialog } from "@angular/material/dialog";

dayjs.extend(utc);
@Component({
  selector: "app-imagery-status",
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatMenuModule,
    NgxDaterangepickerMd,
    MatIconModule,
    MatButtonModule,
    UtcDateTimePipe
  ],
  templateUrl: "./imagery-status.component.html",
  styleUrl: "./imagery-status.component.scss",
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ImageryStatusComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<any>(/* your data source */);
  columns = [
    { id: "acquisition_datetime", displayName: "Date", visible: true },
    // { id: "vendor_name", displayName: "Vendor", visible: true },
    { id: "successful", displayName: "Successful", visible: true },
    { id: "failed", displayName: "Failed", visible: true },
    { id: "total", displayName: "Total", visible: true },
  ];

  expandedElement: any | null;


  innerDisplayedColumns = ['date','vendor_name','successful', 'failed', 'total'];

  get displayedColumns(): string[] {
    return [
      ...this.columns.filter((c) => c.visible).map((c) => c.id), // Keep expand column always visible
      'expand'
    ];
  }
  total_count: any;
  @ViewChild(MatSort) sort!: MatSort;
  page_size = 100;
  perPageSize = 20;
  page_number = 1;
  loader: boolean = false;
  filterParams: any;
  @ViewChild("scrollableDiv") scrollableDiv!: ElementRef<HTMLDivElement>;
  sliderShow: boolean = false;
  filterCount: any = 0;
  vendor = new FormControl([]);
  //Default Query parameters
  defaultFilter() {
    return {
      page_number: 1,
      page_size: 100,
    };
  }
  originalData: any[] = [];
  @ViewChild("menuFilterTrigger") menuFilterTrigger!: MatMenuTrigger;
  @Output() closeDrawer = new EventEmitter<boolean>();
  @ViewChild('startDatePicker', { read: DaterangepickerDirective }) startDatePicker: DaterangepickerDirective;
  @ViewChild('endDatePicker', { read: DaterangepickerDirective }) endDatePicker: DaterangepickerDirective;
  vendorsList: any[] = [
    "airbus",
    "blacksky",
    "capella",
    "maxar",
    "planet",
    "skyfi-umbra",
  ];
  maxDate: any = dayjs().utc();
  locale = {
    format: "YYYY-MM-DD", // Custom format with UTC label
    
  };
  start_date: any = null;
  end_date: any = null;
  minDate:any=dayjs().utc();
  constructor(
    private satelliteService: SatelliteService,
    private el: ElementRef,
    private renderer: Renderer2,
    private sharedService: SharedService,
    private overlayContainer: OverlayContainer,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
   
  ) {
    effect(() => {
      const imageryData = this.sharedService.imageryData();
      const imagertFilter = this.sharedService.imageryFilter();
      if (imageryData.length !== null) {
        this.dataSource.data = imageryData;
        this.originalData = [...this.dataSource.data];
        console.log(imageryData, 'Shared Service Data Updated');
        console.log(this.sharedService.imageryFilter(),'imageryFilterimageryFilterimageryFilterimageryFilter');
        
      }
      if(imagertFilter!==null&& imagertFilter.filterParams!== null){
        this.filterParams = imagertFilter.filterParams;
        this.filterCount  = imagertFilter.filterCount;
        this.start_date = imagertFilter.filterParams.start_date;
        this.end_date = imagertFilter.filterParams.end_date;
        this.vendor.patchValue(imagertFilter.filterParams.vendor_name.split(',')) 
      }
    });
  }

  initializeDates() {
    let today = dayjs().utc().startOf('day'); // Today's date at 00:00 UTC
    let now = dayjs().utc(); // Current date & time

    this.start_date = today; // Default start date is today at 00:00 UTC

    // If today, set end_date to current time, else set to 23:59 UTC
    this.end_date = now.isSame(today, 'day') ? now : today.endOf('day');
  }


  toggleRow(element: any) {
    
    element.records && element.records?.length ? (this.expandedElement = this.expandedElement === element ? null : element) : null;
    // this.cd.detectChanges();
  }

  ngOnInit(): void {
    this.maxDate = this.maxDate.format("YYYY-MM-DD HH:mm [UTC]");
    this.minDate = this.minDate.format("YYYY-MM-DD HH:mm [UTC]");
    this.filterParams = { ...this.defaultFilter() };
    if(this.sharedService.imageryData() == null) {
    //   this.dataSource.data = this.sharedService.imageryData();
    //   this.originalData = [...this.dataSource.data]
    // console.log(this.sharedService.imageryData(),'sharedServicesharedServicesharedService');

    
      let queryParams = {
        ...this.filterParams,
        page_number: 1,
        page_size: this.page_size,
      };
      this.getImageryCollection(queryParams);
    }
    console.log(this.maxDate, "sssssssssssssssss");
    this.maxDate = this.maxDate.format("YYYY-MM-DD HH:mm [UTC]");
    this.minDate = this.minDate.format("YYYY-MM-DD HH:mm [UTC]");
    
    
    
  }

  ngAfterViewInit(): void {
    if (this.dataSource) {
      setTimeout(() => {
        this.setDynamicHeight();
        window.addEventListener("resize", this.setDynamicHeight.bind(this));
      }, 300);
    }
    // this.dataSource.sort = this.sort;
    const div = this.scrollableDiv?.nativeElement;

    // Add scroll event listener

    div.addEventListener("wheel", this.handleWheelEvent);
  }

  //Get Imagery Collection histroy data
  getImageryCollection(queryParams: any) {

    this.satelliteService.getCollectionHistory(queryParams).subscribe({
      next: (resp) => {
        this.dataSource.data = resp.data.records
        // .map((item, idx) => ({
        //   ...item,
        //   index: idx,
        // }));
        this.originalData = [...this.dataSource.data];
        this.sharedService.imageryData.set(resp.data.records)
        this.total_count = resp.data.total_records;
      },
    });
  }

  private canTriggerAction = true;
  private isAtBottom = false;

  //Scroll to bottom event
  private handleWheelEvent = (event: WheelEvent): void => {
    const div = this.scrollableDiv?.nativeElement;

    // Detect if at the bottom
    const isAtBottom =
      div.scrollTop + div.clientHeight + 150 >= div.scrollHeight;

    // Only trigger if at the bottom and trying to scroll down
    if (isAtBottom && event.deltaY > 0 && this.canTriggerAction) {
      if (!this.isAtBottom) {
        this.isAtBottom = true; // Lock the event trigger
        let num = this.page_number;
        this.page_number = num + 1;
        
          let queryParams = {
            ...this.filterParams,
            page_number: this.page_number,
            page_size: this.page_size,
          };
          this.satelliteService.getCollectionHistory(queryParams).subscribe({
            next: (resp) => {
              const data = resp.data.records.map((item, idx) => ({
                ...item,
                index: idx,
              }));
              this.dataSource.data = this.dataSource.data.concat(data);
              this.originalData = [...this.dataSource.data];
            },
          });
          this.loader = true;
          // this.ngxLoader.start(); // Start the loader
        
        setTimeout(() => {
          this.setDynamicHeight();
          window.addEventListener("resize", this.setDynamicHeight.bind(this));
        }, 300);
        // Set debounce flag to false and reset it after 3 seconds
        this.canTriggerAction = false;
        setTimeout(() => {
          this.canTriggerAction = true;
          this.isAtBottom = false; // Reset at bottom flag
        }, 2000); // 3 seconds delay
      }
    }
  };

  //Setting Dynamic Height
  setDynamicHeight(): void {
    // Get the height of the elements above

    const header = document.getElementById("header");

    // Calculate the total height of all the above elements
    const totalHeight = [header].reduce(
      (acc, el) => acc + (el ? el.offsetHeight : 0),
      0
    );

    // Get the height of the viewport
    const viewportHeight = window.innerHeight;

    // Calculate the remaining height for the target div
    const remainingHeight = viewportHeight - totalHeight - 126;

    // Get the content div and apply the calculated height
    const contentDiv = this.el.nativeElement.querySelector(".content");

    if (contentDiv) {
      this.renderer.setStyle(contentDiv, "height", `${remainingHeight}px`);
    }
  }
  ngOnDestroy(): void {
    window.removeEventListener("resize", this.setDynamicHeight.bind(this)); // Clean up event listener
    const div = this.scrollableDiv?.nativeElement;
    // Remove all listeners to avoid memory leaks
  }

  //Close library drawer functionality

  closeLibraryDrawer() {
    this.closeDrawer.emit(true);
    this.sharedService.setIsOpenedEventCalendar(false);
  }

  //Table On sort direction functionality
  onSortChange(event: { active: string; direction: string }) {
    this.sortData();
  }

  //Table data sorting functions
  sortData() {
    const activeColumn = this.sort.active;
    const direction = this.sort.direction;

    if (!activeColumn || direction === "") {
      return;
    }


    let queryParams: any = this.filterParams;

    if (activeColumn) {
      queryParams = {
        ...queryParams,
        sort_by: activeColumn,
        sort_order: direction,
      };
    }
    this.loader = true;
    // this.ngxLoader.start(); // Start the loader
    this.getImageryCollection(queryParams);
  }
  getFormattedDate(date: Date, centroid?: [number, number]): string {
    // Format date in UTC
    return momentZone(date).utc().format("YYYY-MM-DD");
  }

  //Format time in UTC fucntionality
  formatUtcTime(payload) {
    // Check if payload contains valid acquisition_datetime
    if (!payload?.created_at) {
      throw new Error("Invalid payload or acquisition_datetime missing");
    }

    const date = new Date(payload.created_at);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date passed");
    }

    return momentZone.utc(date).format("HH:mm [UTC]");
  }
  //Menu close
  onMenuClose() {
    this.sliderShow = false;
  }
  //Set filter menu class
  setFilterClass() {
    const containerElement = this.overlayContainer.getContainerElement();
    // Remove existing class before adding a new one
    const classesToRemove = [
      "column-menu",
      "library-overlay-container",
      "site-menu",
      "custom-menu-container",
      "group-overlay-container",
      "filter-overlay-container",
      "log-view-menu"
    ];
    containerElement.classList.remove(...classesToRemove);
    containerElement.classList.add("imagery-filter-container");
    containerElement.addEventListener("click", (event: Event) => {
      event.stopPropagation();
    });
  }
  //Form Submit filter functionality
  onSubmit() {
    // this.updateFilterCount();

    // const datetime = this.formGroup.value.end_date;
    // const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
     

      // Check vendor filter
      const newVendorValue = this.vendor?.value?.length > 0 ? this.vendor.value.join(',') : null;
      if (newVendorValue !== this.filterParams.vendor_name) {
        console.log(newVendorValue,'newVendorValuenewVendorValuenewVendorValuenewVendorValue');
        
        this.filterParams = {
          ...this.filterParams,
          vendor_name: newVendorValue == null? '' : newVendorValue,
        };
       newVendorValue !==null? this.filterCount++:this.filterCount--;
      }
      
      // Check start_date filter
      if (this.start_date.startDate !== null) {
        
        const formattedStartDate = dayjs(this.start_date ?this.start_date:this.start_date.startDate)
        .startOf('day') // Sets time to 00:00:00.000
        .utc()
        .format('YYYY-MM-DDTHH:mm:ss.SSSSSS');
      
        if (this.filterParams.start_date !== formattedStartDate) {
          !this.filterParams.start_date ? this.filterCount++: '';
          this.filterParams = {
            ...this.filterParams,
            start_date: formattedStartDate,
          };
          
        }
      }
      
      // Check end_date filter
      if (this.end_date.endDate !== null) {
        
        const formattedEndDate = dayjs(this.end_date?this.end_date:this.end_date.endDate)
        .endOf('day') // Sets time to 23:59:59.999
        .utc()
        .format('YYYY-MM-DDTHH:mm:ss.SSSSSS');
      
        if (this.filterParams.end_date !== formattedEndDate) {
          !this.filterParams.end_date ? this.filterCount++: '';
          this.filterParams = {
            ...this.filterParams,
            end_date: formattedEndDate,
          };
         
        }
      }
      
      // Add pagination params
      
      // Log the number of applied filters
      

    const params = {
      ...this.filterParams,
      page_number: 1,
      page_size: 100,
    };

    this.filterParams = { ...params };
    this.sharedService.imageryFilter.set({filterParams:this.filterParams,filterCount:this.filterCount}, )
    if(this.filterParams.start_date || this.filterParams.end_date || this.filterParams.vendor_name || newVendorValue==null) {
    setTimeout(() => {
      this.loader = true;
      // this.ngxLoader.start(); // Start the loader
      this.getImageryCollection(params);
      this.closeFilterMenu();
    }, 300);
    }
  }

  //Filter menu close button
  closeFilterMenu() {

    if (this.menuFilterTrigger) {
      this.menuFilterTrigger.closeMenu();
    }
  }

  onStartDateChange(event) {
    
    if (event.startDate) {
     let date = dayjs(event.startDate).utc().startOf('day'); // Force start of day
      
      let today = dayjs().utc().startOf('day');
      
      // If start date is today, end date = current time, else set to 23:59
    this.start_date=date.isSame(today, 'day') ? dayjs().utc(): date.startOf('day')
    this.minDate = this.start_date
    }
  }

  //On End Date Change function
  onEndDateChange(event) {
    
    if (event.endDate) {
      let selectedEndDate = dayjs(event.endDate).utc();
      // Ensure End Date is not before Start Date
      if (selectedEndDate.isBefore(this.start_date)) {
        this.end_date = null
        return console.error('End Date must be after Start date')
      } else if (selectedEndDate.isSame(dayjs().utc(), 'day')) {
        this.end_date = dayjs().utc()
      //  return this.formGroup.get('end_date').setValue(dayjs().utc())
      } else {
        
        this.end_date = dayjs(selectedEndDate).utc().endOf('day')
        // this.formGroup.get('end_date').setValue(dayjs(selectedEndDate).utc().endOf('day'));
      }
    }
  }

  //Filter reset Function
  resetFilter(): void {
    this.filterCount = 0
    this.vendor.reset()
    this.start_date = ''
    this.end_date = ''
    let queryParams = {
      page_number:1,
      page_size : 50
    }
    this.filterParams = queryParams
    this.sharedService.imageryFilter.set({filterParams:this.filterParams,filterCount:this.filterCount}, )
    this.getImageryCollection(queryParams)
  }

  onStartDateFocus() {
    if (this.endDatePicker && this.endDatePicker.opens) {
      this.endDatePicker.hide();
    }
  }

  onEndDateFocus() {
    if (this.startDatePicker && this.startDatePicker.opens) {
      this.startDatePicker.hide();
    }
  }

  openEndDatePicker(){
    this.endDatePicker.open();
    if (this.startDatePicker && this.startDatePicker.opens) {
      this.startDatePicker.hide();
    }
  }
  openStartDatePicker(){
    this.startDatePicker.open();
    if (this.endDatePicker && this.endDatePicker.opens) {
      this.endDatePicker.hide();
    }
  }

  setClass(){
    const classesToRemove = ['site-menu', 'filter-overlay-container','library-overlay-container','imagery-filter-container','column-menu,custom-menu-container'];
    const containerElement = this.overlayContainer.getContainerElement();
    containerElement.classList.remove(...classesToRemove);
    containerElement.classList.add('log-view-menu');  
  }

  openDialog(data:any){
    const logData = {type:'logs', data:data}
      const dialogRef = this.dialog.open(CommonDailogsComponent, {
          width: 'auto',
          height: 'auto',
          minWidth:'300px',
          data: logData,
          panelClass: 'custom-dialog-class',
        });
        dialogRef.afterClosed().subscribe((result) => {
          if(result){
           
              
            }
  
          
        
    })
  }
}
