import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { TemplateRef } from "@angular/core";
import { ViewChild } from "@angular/core";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { SelectionModel } from "@angular/cdk/collections";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { MatDialog } from "@angular/material/dialog";
import { ImagePreviewComponent } from "../../dailogs/image-preview/image-preview.component";
import { SharedService } from "../shared/shared.service";
import { SatelliteService } from "../../services/satellite.service";
import dayjs from "dayjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { GroupsListComponent } from "../../common/groups-list/groups-list.component";
import { catchError, debounceTime, of, Subject, switchMap } from "rxjs";
import { MapControllersPopupComponent } from "../../dailogs/map-controllers-popup/map-controllers-popup.component";
import { MatSort, MatSortModule, Sort } from "@angular/material/sort";
import { LiveAnnouncer } from "@angular/cdk/a11y";
import moment from "moment";
import { NgxUiLoaderModule, NgxUiLoaderService } from "ngx-ui-loader";
import { DateFormatPipe } from "../../pipes/date-format.pipe";
import { log } from "console";

export class Group {
  name?: string;
  icon?: string; // icon name for Angular Material icons
  children?: Group[]; // nested groups
}

export interface PeriodicElement {
  acquisition_datetime: string;  // Store date as string, but we'll sort it as Date
  sensor: string;
  area: number;
  cloud_cover: number;
  coordinates_record: { type: string; coordinates: any[] };
  georeferenced: any;
  id: number;
  image_uploaded: boolean;
  presigned_url: string;
  resolution: string;
  sun_elevation: number;
  type: string;
  vendor_id: string;
  vendor_name: string;
  [key: string]: string | number | boolean | any;
}


@Component({
  selector: "app-library",
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatMenuModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatCheckboxModule,
    MatListModule,
    MatIconModule,
    MatTableModule,
    GroupsListComponent,
    MatSortModule,
    NgxUiLoaderModule,
    DateFormatPipe
],
  templateUrl: "./library.component.html",
  styleUrl: "./library.component.scss",
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
export class LibraryComponent implements OnInit,OnDestroy,AfterViewInit {
  //#region Decorators
  @ViewChild("myTemplate", { static: true }) myTemplate!: TemplateRef<any>;
  @Output() closeDrawer = new EventEmitter<boolean>();
  @Input() polygon_wkt:any;
  //#endregion
  @Output() rowHoveredData: EventEmitter<any> = new EventEmitter();
  //#region variables
  renderGroup!: TemplateRef<any> | null;
  checked: boolean = false;
  analyticsData:any = null;
  groups: Group[] = [
    { name: "Group name", icon: "folder", children: [] },
    {
      name: "Group name",
      icon: "folder",
      children: [
        { name: "Subgroup name", icon: "folder_open", children: [] },
        { name: "Another subgroup", icon: "folder", children: [] },
      ],
    },
  ];

  expandedElement: PeriodicElement | null = null;
  dataSource = new MatTableDataSource<any>(/* your data source */);
  displayedColumns: string[] = [
    "selectDate",
    "Sensor",
    "Vendor",
    "Cover",
    "Resolution",
    "type",
    "Id",
  ];
  total_count:any
  selection = new SelectionModel<PeriodicElement>(true, []);


  viewType: "table" | "browse" = "table";
  isEventsOpened: boolean = false;
  percentageArray:any
  imageHover:any ; 
  //#endregion
  vendorData:any;
  name:string = "Untitled point";
  siteData:any;
  addGroup:boolean = false;
  private snackBar = inject(MatSnackBar);
  activeGroup:any;
  selectedGroup:any
  searchInput = new Subject<string>();
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  @Output() notifyParent: EventEmitter<any> = new EventEmitter();
  private _startDate: any;
  private _endDate: any;

  @Input()
  set startDate(value: any) {
    if (value !== this._startDate) {
      this._startDate = value;
      console.log('startDate updated:', this._startDate);
      let queryParams ={
        page_number: '1',
        page_size: '16',
        start_date:this.startDate,
        end_date: this.endDate,
        source: 'library',
        
      }
      const payload = {
        wkt_polygon: this.polygon_wkt
      }
      if (this.polygon_wkt) {
        setTimeout(() => {
          this.loader = true
          this.ngxLoader.start(); // Start the loader
          this.getSatelliteCatalog(payload,queryParams)
         },300)
      }
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
  selectedRow:any = null;
  imageData:any;
  @ViewChild(MatSort) sort!: MatSort;
  originalData: any[] = [];
  selectedZone:string = 'UTC'
  @ViewChild('scrollableDiv') scrollableDiv!: ElementRef<HTMLDivElement>;
  page_size = '16';
  perPageSize= 16;
  page_number = '1';
  loader:boolean = false;
  private _zoomed_wkt: string ='';
  zoomed_captures_count:number ;
  private debounceTimeout: any;
  selectedObjects:any[]
  @Input()
set zoomed_wkt(value: string) {
  if (value !== this._zoomed_wkt) {
    this._zoomed_wkt = value;
    console.log('librarylibrarylibrarylibrarylibrary', this.page_size);

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout); // Clear the existing timeout if any
    }

    this.debounceTimeout = setTimeout(() => {
      if (this._zoomed_wkt !== '') {
        let queryParams = {
          page_number: '1',
          page_size: this.page_size,
          start_date: this.startDate,
          end_date: this.endDate,
          source: 'library',
          zoomed_wkt: this._zoomed_wkt
        };
        const payload = {
          wkt_polygon: this.polygon_wkt
        };
        this.loader = true;
        this.ngxLoader.start(); // Start the loader
        this.page_number = '1';
        this.getSatelliteCatalog(payload, queryParams);
        
      }
    }, 600);
     // Debounce time: 600ms
  }
  this.setDynamicHeight();
  window.addEventListener('resize', this.setDynamicHeight.bind(this))
  const div = this.scrollableDiv?.nativeElement;
  this.canTriggerAction = true
  div.addEventListener('wheel', this.handleWheelEvent);
  console.log('valuevaluevaluevaluevalue', value);
}
  
  get zoomed_wkt(): string {
    return this._zoomed_wkt;
  }
  constructor(
    private dialog: MatDialog,
    private sharedService: SharedService,
     private satelliteService:SatelliteService,
     private el: ElementRef, private renderer: Renderer2,
     private cdr:ChangeDetectorRef,
     private ngxLoader: NgxUiLoaderService
  ) {
     this.searchInput.pipe(
          debounceTime(1000),  // Wait for 1000ms after the last key press
          switchMap((inputValue) => {
            const data = { group_name: inputValue };
            return this.satelliteService.getGroupsForAssignment(data).pipe(
              catchError((err) => {
                console.error('API error:', err);
                // Return an empty array to allow subsequent API calls to be made
                return of({ data: [] });
              })
            );
          })
        ).subscribe({
          next: (resp) => {
            console.log(resp, 'API Response');
            this.groups = resp?.data;
          },
          error: (err) => {
            console.error('API call failed', err);
          }
        });
  }

  ngOnInit() {
   
    
    this.renderGroup = this.myTemplate;
    // this.sharedService.isOpenedEventCalendar$.subscribe(resp=>this.isEventsOpened=resp)
    if(this.polygon_wkt){
      const data = { polygon_wkt: this.polygon_wkt };
      this.satelliteService.getPolygonSelectionAnalytics(data).subscribe({
        next: (res) => {
          console.log(res,'resresresresresresresresres');
          this.analyticsData = res?.data?.analytics
          this.percentageArray = Object.entries(this.analyticsData?.percentages).map(([key, value]) => ({
            key,
            ...(value as object),
          }));
        }
      })
      let queryParams ={
        page_number: '1',
        page_size: '16',
        start_date:this.startDate,
        end_date: this.endDate,
        source: 'library',
        
      }
      const payload = {
        wkt_polygon: this.polygon_wkt
      }
     setTimeout(() => {
      this.loader = true
      this.ngxLoader.start(); // Start the loader
      this.getSatelliteCatalog(payload,queryParams)
     },300)
      
    }
    
  }

  ngAfterViewInit(): void {
    if(this.dataSource ){
      setTimeout(() => {
        this.setDynamicHeight();
        window.addEventListener('resize', this.setDynamicHeight.bind(this))
    }, 300); 
    }
    this.dataSource.sort = this.sort;
    console.log(this.dataSource,'sortsortsortsortsort');
    this.sort?.sortChange.pipe(
      debounceTime(300) // Adjust the time as needed
    ).subscribe((sortState) => {
      console.log('Sorting changed:', sortState);
      console.log('Sorted Data:', this.dataSource.filteredData);
      this.sortData(); // Will only be called once after the debounce time
    });
    const div = this.scrollableDiv?.nativeElement;

    // Add scroll event listener
  
    div.addEventListener('wheel', this.handleWheelEvent);

    // Add mouse events
  }

  sortData() {
    this.expandedElement = null
    const activeColumn = this.sort.active;
    const direction = this.sort.direction;

    if (!activeColumn || direction === '') {
      return;
    }

    console.log(activeColumn,'activeColumnactiveColumnactiveColumn',direction);
    
   

      if (activeColumn === 'selectDate') {
        // const dateA = new Date(a.acquisition_datetime).getTime();
        // const dateB = new Date(b.acquisition_datetime).getTime();
        let queryParams ={
          page_number: '1',
          page_size: '16',
          start_date:this.startDate,
          end_date: this.endDate,
          source: 'library',
          sort_by:'acquisition_datetime',
          sort_order:direction
        }
        const payload = {
          wkt_polygon: this.polygon_wkt
        }
        this.loader = true
      this.ngxLoader.start(); // Start the loader
       
        this.getSatelliteCatalog(payload,queryParams)
        
        
        // compareResult = dateA > dateB ? 1 : dateA < dateB ? -1 : 0;
      } else if (activeColumn === 'Sensor') {
        // const sensorA = a.sensor.toLowerCase();
        // const sensorB = b.sensor.toLowerCase();
        // compareResult = sensorA.localeCompare(sensorB);
        // console.log(sensorA,'dateAdateAdateAdateA');
        // console.log(sensorB,'dateBdateBdateBdateBdateB');
        let queryParams ={
          page_number: '1',
          page_size: '16',
          start_date:this.startDate,
          end_date: this.endDate,
          source: 'library',
          sort_by:'sensor',
          sort_order:direction
        }
        const payload = {
          wkt_polygon: this.polygon_wkt
        }
        this.loader = true
      this.ngxLoader.start(); // Start the loader
        this.getSatelliteCatalog(payload,queryParams)
      } else if (activeColumn === 'Vendor') {
        // const sensorA = a.sensor.toLowerCase();
        // const sensorB = b.sensor.toLowerCase();
        // compareResult = sensorA.localeCompare(sensorB);
        // console.log(sensorA,'dateAdateAdateAdateA');
        // console.log(sensorB,'dateBdateBdateBdateBdateB');
        let queryParams ={
          page_number: '1',
          page_size: '16',
          start_date:this.startDate,
          end_date: this.endDate,
          source: 'library',
          sort_by:'vendor_name',
          sort_order:direction
        }
        const payload = {
          wkt_polygon: this.polygon_wkt
        }
        this.loader = true
      this.ngxLoader.start(); // Start the loader
        this.getSatelliteCatalog(payload,queryParams)
      }
     
      

    
  
   
  }

  getSatelliteCatalog(payload:any,queryParams:any){
    console.log('getSatelliteCatalog');
    
    this.satelliteService.getDataFromPolygon(payload,queryParams).subscribe({
      next: (resp) => {
        // console.log(resp,'queryParamsqueryParamsqueryParamsqueryParams');
        this.dataSource.data = resp.data.map((item, idx) => ({
          ...item,
          index: idx
        }));
        this.originalData = [...this.dataSource.data];
        this.total_count = resp.total_records
        this.zoomed_captures_count = resp.zoomed_captures_count
        this.loader = false
        this.ngxLoader.stop();
        setTimeout(() => {
          this.setDynamicHeight();
          window.addEventListener('resize', this.setDynamicHeight.bind(this))
          const div = this.scrollableDiv?.nativeElement;
          div.addEventListener('wheel', this.handleWheelEvent);
      }, 800); 
      },
      error: (err) => {
        this.loader = false
        this.ngxLoader.stop();
        console.log("err getPolyGonData: ", err);
      },
    });
  }

  resetSorting() {
    // Reset the dataSource to the original unsorted data
    let queryParams ={
      page_number: '1',
      page_size: '16',
      start_date:this.startDate,
      end_date: this.endDate,
      source: 'library',
     
      
    }
    const payload = {
      wkt_polygon: this.polygon_wkt
    }
    this.loader = true
      this.ngxLoader.start(); // Start the loader
    this.getSatelliteCatalog(payload,queryParams)
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  closeLibraryDrawer() {
    this.closeDrawer.emit(true);
    this.sharedService.setIsOpenedEventCalendar(false);
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  selectPreviewMethod(type: "table" | "browse") {
    window.removeEventListener('resize', this.setDynamicHeight.bind(this));
    this.viewType = type;
    setTimeout(() => {
      this.setDynamicHeight();
      window.addEventListener('resize', this.setDynamicHeight.bind(this))
      const div = this.scrollableDiv?.nativeElement;
      div.addEventListener('wheel', this.handleWheelEvent);
  }, 300); 
   
  }

  openImagePreviewDialog(index:any) {
    const dialogRef = this.dialog.open(ImagePreviewComponent, {
      width: "auto",
      maxHeight:'auto',
      data:  {images:this.dataSource, currentIndex:index} ,
      panelClass: "custom-preview",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log("Selected date range:", result);
      }
    });
  }

  calendarEventsOpen() {
    this.isEventsOpened = !this.isEventsOpened;
    this.sharedService.setIsOpenedEventCalendar(this.isEventsOpened);
  }

  //calculate newest and oldest in days week months or year
  getHumanReadableDateDifference(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInMonths / 12);
  
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
    } else if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    } else {
      return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
    }
  }

  //Total Number formatting in human-readable format with suffixes like k (thousands), m (millions), b (billions), etc.
  formatNumber(totalCount: number): string {
    if (totalCount >= 1_000_000_000) {
      return `${(totalCount / 1_000_000_000).toFixed(1)}b`; // Billions
    } else if (totalCount >= 1_000_000) {
      return `${(totalCount / 1_000_000).toFixed(1)}m`; // Millions
    } else if (totalCount >= 1_000) {
      return `${(totalCount / 1_000).toFixed(1)}k`; // Thousands
    } else {
      return totalCount.toString(); // Less than 1,000
    }
  }

  getValue(value:any,total:any){
    return value *100 / total
  }

  getFormattedDate(date: Date): string {
    if (this.selectedZone =='UTC') {
      return dayjs(date).utc().format('YYYY.MM.DD'); // Format for UTC
    } else {
      return dayjs(date).local().format('YYYY.MM.DD'); // Format for local time
    }
  }
  formatUtcTime(payload: string | Date): string {
    // If payload is a string, convert it to Date first
    const date = new Date(payload);
  
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date passed');
    }
  
    // Get the hours and minutes based on the desired time zone
    const hours = this.selectedZone =='UTC' ? date.getUTCHours() : date.getHours();
    const minutes = this.selectedZone =='UTC' ? date.getUTCMinutes() : date.getMinutes();
  
    // Format the hours and minutes with leading zeros
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
  
    // Return formatted time, appending "UTC" if in UTC
    return `${formattedHours}:${formattedMinutes}${this.selectedZone =='UTC' ? ' UTC' : ''}`;
  }
  
  // imageHoverView(data:any){
  //   console.log(data,'datadatadatadatadatadata');
    
  //   this.imageHover = data
  //   if (data !== null && !this.vendorData) {
  //     let queryParams ={
  //       page_number: '1',
  //       page_size: '100',
  //       start_date:'',
  //       end_date: '',
  //       vendor_id:data.vendor_id
  //     }
  //     this.satelliteService.getDataFromPolygon('',queryParams).subscribe({
  //       next: (resp) => {
  //         console.log(resp,'queryParamsqueryParamsqueryParamsqueryParams');
  //         this.vendorData = resp.data[0]
  //         const dialogRef = this.dialog.open(MapControllersPopupComponent, {
  //             width: `300px`,
  //             height: 'auto',
  //             data: { type: 'vendor', vendorData: this.vendorData },
  //             panelClass: 'checkbox-dialog',
  //           });
  //           dialogRef.afterClosed().subscribe((result) => {
  //             console.log('Dialog closed', result);
  //             this.selectedRow = null;
  //             this.vendorData = null;
  //           });
  //       },
  //       error: (err) => {
  //         console.log("err getPolyGonData: ", err);
  //       },
  //     });
  //   } else {
  //     this.vendorData = null
  //   }
  // }
  formatToThreeDecimalPlaces(value: string): string {
    // Check if the string ends with "m"
    // Extract the numeric part and parse it as a float
    const numericPart = parseFloat(value.slice(0, -1));
    // Format the numeric part to 3 decimal places
    const formattedNumber = numericPart.toFixed(2);

    // Reattach the "m" unit and return
    return `${formattedNumber}m`;
}

addSite(type:any) {
  console.log(type,'typetypetypetypetypetype');
  
  let payload
  if(type === 'site'){
    payload = {
      name: this.name,
      coordinates_record: {
        type: "Polygon",
        coordinates:  this.convertPolygonToCoordinates(this.polygon_wkt)
      },
      site_type: this.vendorData?.coordinates_record?.coordinates[0].length > 5 ? 'Polygon' : 'Rectangle'
    }
  } else{
    payload = {
      name: this.name,
      coordinates_record: {
        type: "Polygon",
        coordinates: this.vendorData?.coordinates_record?.coordinates
      },
      site_type: this.vendorData?.coordinates_record?.coordinates[0].length > 5 ? 'Polygon' : 'Rectangle'
    }
  }
  console.log(payload,'payloadpayloadpayloadpayload');
  

  this.satelliteService.addSite(payload).subscribe({
    next: (resp) => {
      this.snackBar.open('Site has been added.', 'Ok', {
        duration: 2000  // Snackbar will disappear after 300 milliseconds
      });
      console.log(resp, 'successsuccesssuccesssuccess');
      this.siteData = resp
      this.addGroup = true;  // This will execute if the API call is successful

    },
    error: (err) => {
      console.error('Error occurred:', err);

      this.addGroup = false;



    }
  });

}

copyToClipboard(data: any): void {
  if (data) {
    // Create a temporary input element to copy text
    const inputElement = document.createElement('input');
    inputElement.value = data;
    document.body.appendChild(inputElement);
    inputElement.select();
    document.execCommand('copy');
    document.body.removeChild(inputElement);

    // Optionally alert the user

    this.snackBar.open('Address copied to clipboard!', 'Ok', {
      duration: 2000  // Snackbar will disappear after 300 milliseconds
    });
  }
}

convertPolygonToCoordinates(polygon: string): [number, number][][] {
  // Remove "POLYGON ((" and "))" to extract the raw coordinates
  const rawCoordinates = polygon
      .replace("POLYGON ((", "")
      .replace("))", "");

  // Split the raw coordinates into an array of individual points
  const points = rawCoordinates.split(", ");

  // Map the points into an array of [number, number] tuples
  const coordinates: [number, number][][] = [
      points.map(point => {
          const [lng, lat] = point.split(" ").map(Number); // Split and convert to numbers
          return [lng, lat];
      })
  ];

  return coordinates;
}

getGroups() {
  this.selectedGroupEvent(null)
  if (this.addGroup) {
    const data = {
      group_name: ''
    }
    this.satelliteService.getGroupsForAssignment(data).subscribe({
      next: (resp) => {
        console.log(resp, 'respresprespresprespresprespresprespresp');
        this.groups = resp

      }
    })
  } else {
    this.snackBar.open('Please first add site.', 'Close', {
      duration: 3000,
      verticalPosition: 'top',
    });
  }

}

selectedGroupEvent(event: any) {
  console.log(event, 'selectedeventeventeventevent');
  this.activeGroup = event
}

saveGroup() {
  this.selectedGroup = this.activeGroup.group
  const payload = {
    group_id: this.selectedGroup.id,
    site_id: this.siteData.id
  }
  this.satelliteService.addGroupSite(payload).subscribe({
    next: (res) => {
      console.log(res, 'updatedaaaaaaaaaaaaaaaaaa');
      this.snackBar.open(res.message, 'Ok', {
        duration: 2000  // Snackbar will disappear after 300 milliseconds
      });
    },
    error: (err) => {

    }
  })
  this.closeMenu()
}
closeMenu() {
  // Close the menu
  if (this.menuTrigger) {
    this.menuTrigger.closeMenu();
  }
}

onKeyPress(event: KeyboardEvent): void {
  const inputValue = (event.target as HTMLInputElement).value;
  console.log(inputValue, 'inputValueinputValueinputValue'); // Log the current input value to the console
  const data = {
    group_name: inputValue
  }
  // this.satelliteService.getGroupsForAssignment(data).subscribe({
  //   next: (resp) => {
  //     console.log(resp,'respresprespresprespresprespresprespresp');

  //     this.groups = resp?.data

  //   }})
  console.log(this.searchInput, 'searchiiiiiiiiiiiiiiiii');

  this.searchInput.next(inputValue);
}

// On table row expand click
expandedData(data: any) {
  let expandedElement = data;
  console.log(expandedElement, 'expandedElementexpandedElementexpandedElement');

  // Initialize the array if it doesn't exist
  if (!this.selectedObjects) {
    this.selectedObjects = [];
  }

  // Check if the object with the given ID already exists in the array
  const index = this.selectedObjects.findIndex(obj => obj.id === expandedElement.id);

  if (index === -1) {
    // If the object does not exist, push it to the array
    this.selectedObjects.push(expandedElement);
  } else {
    // If the object exists, remove it from the array
    this.selectedObjects.splice(index, 1);
  }

  // Emit the updated array
  this.notifyParent.emit(this.selectedObjects);

  console.log(this.selectedObjects, 'Updated selectedObjects array');
}


//Table Row hover event Emit
onRowHover(data:any){

    this.rowHoveredData.emit(data)
  
}

//Setting Dynamic Height
setDynamicHeight(): void {
  // Get the height of the elements above
  if(this.viewType === "table"){
    const header = document.getElementById('header');
    const analyticsData = document.getElementById('analyticsData');
    const notFound = document.getElementById('not_found');
    const custom = document.getElementById('custom');
    const container = document.getElementById('container');
    
    // Calculate the total height of all the above elements
    const totalHeight = [
      header,
      analyticsData,
      notFound,
      custom,
      container
    ].reduce((acc, el) => acc + (el ? el.offsetHeight : 0), 0);
  
    // Get the height of the viewport
    const viewportHeight = window.innerHeight;
    // Calculate the remaining height for the target div
    const remainingHeight = viewportHeight - totalHeight-126;
  
    // Get the content div and apply the calculated height
    const contentDiv = this.el.nativeElement.querySelector('.content');
    
    if (contentDiv) {
      
      this.renderer.setStyle(contentDiv, 'height', `${remainingHeight}px`);
    }
  } else {
    const header = document.getElementById('header');
  const analyticsData = document.getElementById('analyticsData');
  const notFound = document.getElementById('not_found');
  const custom = document.getElementById('custom');
  const container = document.getElementById('container');
  
  // Calculate the total height of all the above elements
  const totalHeight = [
    header,
    analyticsData,
    notFound,
    custom,
    container
  ].reduce((acc, el) => acc + (el ? el.offsetHeight : 0), 0);

  // Get the height of the viewport
  const viewportHeight = window.innerHeight;

  // Calculate the remaining height for the target div
  const remainingHeight = viewportHeight - totalHeight -126 ;

  // Get the content div and apply the calculated height
  const contentDiv = this.el.nativeElement.querySelector('.browser-content');

  if (contentDiv) {
    this.renderer.setStyle(contentDiv, 'height', `${remainingHeight}px`);
  }
  }
  
}
ngOnDestroy(): void {
  window.removeEventListener('resize', this.setDynamicHeight.bind(this));  // Clean up event listener
  const div = this.scrollableDiv?.nativeElement;

    // Remove all listeners to avoid memory leaks
   
}

// Round off value
roundOff(value: number): number {
  return Math.round(value);
}

// On checkbox change
onCheckboxChange(row: any) {
  console.log(row,'imageHoverViewimageHoverViewimageHoverViewimageHoverViewimageHoverView');
  
  if (this.selectedRow === row) {
    // Uncheck the currently selected checkbox
    this.selectedRow = null;
  } else {
    console.log('lllllllllllll');
    
    // Select the new checkbox
    this.selectedRow = row;
    const dialogRef = this.dialog.open(MapControllersPopupComponent, {
      width: `300px`,
      height: 'auto',
      data: { type: 'vendor', vendorData: this.selectedRow },
      panelClass: 'checkbox-dialog',
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('Dialog closed', result);
      this.selectedRow = null;
      this.vendorData = null;
    });
  }
}

//Time Zone Change
selectedTimeZone(zone: string){
  this.selectedZone = zone;
  this.cdr.detectChanges();
}

//Get Day of Week
getDayOfWeek(date: Date): string {
  if (this.selectedZone === 'UTC') {
    // Get day of the week in UTC
    return dayjs(date).utc().format('dddd');
  } else {
    // Get day of the week in local time
    return dayjs(date).local().format('dddd');
  }
}

private canTriggerAction = true;
private isAtBottom = false;

//Scroll to bottom event 
private handleWheelEvent = (event: WheelEvent): void => {
  const div = this.scrollableDiv?.nativeElement;


  // Detect if at the bottom
  const isAtBottom = div.scrollTop + div.clientHeight+0.5 >= div.scrollHeight;
  // Only trigger if at the bottom and trying to scroll down
  if (isAtBottom && event.deltaY > 0 && this.canTriggerAction) {
    if (!this.isAtBottom) {
      this.isAtBottom = true; // Lock the event trigger
      //  this.customAction('Scroll beyond bottom');
      let num = parseInt(this.page_number, 10)
    let  new_pageNumber = num + 1 ;
    this.page_number = new_pageNumber.toString()
    console.log(this.page_number,'new_pageSizenew_pageSizenew_pageSize',this.zoomed_captures_count);
    if(this.dataSource.data.length<this.total_count){
      let queryParams ={
        page_number: this.page_number,
        page_size: this.page_size,
        start_date:this.startDate,
        end_date: this.endDate,
        source: 'library',
        zoomed_wkt:this._zoomed_wkt
      }
      const payload = {
        wkt_polygon: this.polygon_wkt
      }
     this.loader = true
      this.ngxLoader.start(); // Start the loader

  this.satelliteService.getDataFromPolygon(payload, queryParams).subscribe({
    next: (resp) => {
     
      const data = resp.data.map((item, idx) => ({
        ...item,
        index: idx
      }));
      this.dataSource.data = this.dataSource.data.concat(data);
      this.originalData = [...this.dataSource.data];
      
      setTimeout(() => {
        this.setDynamicHeight();
        window.addEventListener('resize', this.setDynamicHeight.bind(this));
      }, 300);
      this.loader = false
      this.ngxLoader.stop(); // Stop the loader when the data is successfully fetched
    },
    error: (err) => {
      console.log("err getPolyGonData: ", err);
      this.loader = false
      this.ngxLoader.stop(); // Stop the loader even if there is an error
    }
  });
    }
    
      // Set debounce flag to false and reset it after 3 seconds
      this.canTriggerAction = false;
      setTimeout(() => {
        this.canTriggerAction = true;
        this.isAtBottom = false; // Reset at bottom flag
      }, 3000); // 3 seconds delay
    }
  }
};

//Getting time in Day sessions
getTimePeriod(datetime: string): string {
  if(this.selectedZone == 'UTC'){
    const utcDate = dayjs(datetime).utc();

    // Get the hour in UTC
    const hours = utcDate.hour();
  
    // Determine the time period based on the UTC hour
    if (hours >= 5 && hours < 11) {
      return "Morning";
    } else if (hours >= 11 && hours < 16) {
      return "Midday";
    } else if (hours >= 16 && hours < 21) {
      return "Evening";
    } else {
      return "Overnight";
    }
  } else {
    const date = new Date(datetime); // Parse the ISO string to a Date object
    const hours = date.getHours(); // Get the hour (0-23)
  
    if (hours >= 5 && hours < 11) {
      return "Morning";
    } else if (hours >= 11 && hours < 16) {
      return "Midday";
    } else if (hours >= 16 && hours < 21) {
      return "Evening";
    } else {
      return "Overnight";
    }
  }
  // Convert the datetime to UTC using dayjs
  
}

//Formated Date into YYYY-MM-DD
getDateTimeFormat(dateTime: string) {
    if (dateTime) {
      return moment(dateTime, 'YYYY-MM-DD')?.format('YYYY-MM-DD');

    }
    return '';
  }

  isRowSelected(id: any): boolean {
    return this.selectedObjects?.some(obj => obj.id === id);
  }
  //Copy Table row data 
  copyData(data: any) {
    const { acquisition_datetime,sensor, vendor_name, vendor_id, centroid } = data;
    if (!centroid || !Array.isArray(centroid)) {
      this.snackBar.open('Invalid data format!', 'Ok', { duration: 2000 });
      return;
    }
  
    const result = `${acquisition_datetime},${sensor},${vendor_name},${vendor_id},${centroid.join(",")}`;
  
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = result;
    tempTextArea.style.position = 'fixed'; // Avoid scrolling to view the element
    tempTextArea.style.opacity = '0';     // Make it invisible
    document.body.appendChild(tempTextArea);
  
    tempTextArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
      
        this.snackBar.open('Copied successfully!', 'Ok', { duration: 2000 });
      } else {
      
        this.snackBar.open('Failed to copy text.', 'Retry', { duration: 2000 });
      }
    } catch (err) {
     
      this.snackBar.open('Failed to copy text.', 'Retry', { duration: 2000 });
    }
  
    document.body.removeChild(tempTextArea);
  }

  trackByIndex(index: number, item: any): number {
    console.log("indexindexindexindexindex", index);
    
    return index;
  }
  

}
