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
  QueryList,
  Renderer2,
  ViewChildren,
} from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { MatCheckboxChange, MatCheckboxModule } from "@angular/material/checkbox";
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
import { DateFormatPipe,UtcDateTimePipe } from "../../pipes/date-format.pipe";
import { log } from "console";
import { MapCalendarComponent } from "./map-calendar/map-calendar.component";
import { stat } from "fs";
import { OverlayContainer } from "@angular/cdk/overlay";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { MatSliderModule } from "@angular/material/slider";
import { Options,NgxSliderModule, LabelType } from '@angular-slider/ngx-slider';
import momentZone from 'moment-timezone';
import tzLookup from 'tz-lookup';
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
    DateFormatPipe,
    MapCalendarComponent,
    MatDatepickerModule,
    MatSelectModule,
    MatSliderModule,
    NgxSliderModule,
    UtcDateTimePipe
],
providers: [provideNativeDateAdapter()],
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
    "acquisition_datetime",
    "sensor",
    "vendor_name",
    "cloud_cover",
    "gsd",
    "type",
    "vendor_id",
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
  @Output() addMarkerToMap: EventEmitter<any> = new EventEmitter();
  @Output() parentFilter:EventEmitter<any> = new EventEmitter();
  @Output() onFilterset: EventEmitter<any> = new EventEmitter();
  private _startDate: any;
  private _endDate: any;
  matchedObject:any;
  overlapListData:any=[];

  defaultFilter() {
    let minCloud
    if(this.min_cloud <= -1) {
      minCloud = -1
    } else {
      minCloud = this.min_cloud
    } 
    return {
      page_number: '1',
      page_size: '20',
      start_date:this.startDate,
      end_date: this.endDate,
      source: 'library',
      zoomed_wkt:this._zoomed_wkt,
      max_cloud_cover: this.max_cloud,
      min_cloud_cover:minCloud,
      max_off_nadir_angle: this.max_angle === 51 ? 1000: this.max_angle,
      min_off_nadir_angle:this.min_angle,
      vendor_id:this.formGroup.get('vendorId')?.value?this.formGroup.get('vendorId').value:'',
      vendor_name:this.formGroup.get('vendor')?.value?this.formGroup.get('vendor').value?.join(','):'',
      max_gsd:this.max_gsd === 4 ? 1000 : this.max_gsd,
      min_gsd:this.min_gsd,
    }
  }
  @Input()
  set startDate(value: any) {
    if (value !== this._startDate) {
      this._startDate = value;
      console.log('startDate updated:', this._startDate);
      let queryParams = this.defaultFilter();
      const payload = {
        wkt_polygon: this.polygon_wkt
      }
      if (this.polygon_wkt) {
        setTimeout(() => {
        if(this.isEventsOpened){
          
          const payload = {
            polygon_wkt: this.polygon_wkt,
            start_date: this.startDate,
            end_date: this.endDate
          }
          
          // Start the loader
         
        
          this.satelliteService.getPolygonCalenderDays(payload).subscribe({
            next: (resp) => {
            
              this.calendarApiData = resp.data;
              this.loader = true
              this.ngxLoader.start(); // Start the loader
              this.getSatelliteCatalog(payload,queryParams)
            },
            error: (err) => {
              
              console.error('Error fetching calendar data', err);
              // Hide loader on error
             
            },
            
          });
     
          }   
        },300)
      }

      // Add logic to handle the updated value, e.g., update calculations or UI
    }
  }


  get startDate(): any {
    return this._startDate;
  }
  private _shapeHoverData:any
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
  @Input()
  set shapeHoverData(value: any) {
    if (value !== this._shapeHoverData) {
      this._shapeHoverData = value;
      console.log('_shapeHoverData _shapeHoverData _shapeHoverData:', this.shapeHoverData);
      // Add logic to handle the updated value, e.g., update calculations or UI
    } else {
      console.log('shapeHoverDatashapeHoverDatashapeHoverData');
      
    }
  }
  get shapeHoverData(): any {
    return this._shapeHoverData;
  }
  selectedRow:any = null;
  imageData:any;
  @ViewChild(MatSort) sort!: MatSort;
  originalData: any[] = [];
  selectedZone:string = 'UTC'
  @ViewChild('scrollableDiv') scrollableDiv!: ElementRef<HTMLDivElement>;
  page_size = '20';
  perPageSize= 20;
  page_number = '1';
  loader:boolean = false;
  private _zoomed_wkt: string ='';
  zoomed_captures_count:number ;
  private debounceTimeout: any;
  selectedObjects:any[];
  calendarApiData:any;
  OpenEventCalendar:boolean=false;
  tableRowHovered:boolean=false;
  @Input()
set zoomed_wkt(value: string) {
  if (value !== this._zoomed_wkt) {
    this._zoomed_wkt = value;
    console.log('librarylibrarylibrarylibrarylibrary', this.page_size);

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout); // Clear the existing timeout if any
    }

    this.debounceTimeout = setTimeout(() => {
      let minCloud
      if(this.min_cloud <= -1) {
        minCloud = -1
      } else {
        minCloud = this.min_cloud
      } 
      let queryParams: any = {
        page_number: '1',
        page_size: this.page_size,
        start_date: this.startDate,
        end_date: this.endDate,
        source: 'library',
        max_cloud_cover: this.max_cloud,
        min_cloud_cover:minCloud,
        max_off_nadir_angle: this.max_angle === 51 ? 1000: this.max_angle,
        min_off_nadir_angle:this.min_angle,
        vendor_id:this.formGroup.get('vendorId')?.value?this.formGroup.get('vendorId').value:'',
        vendor_name:this.formGroup.get('vendor')?.value?this.formGroup.get('vendor').value?.join(','):'',
        max_gsd:this.max_gsd === 4 ? 1000 : this.max_gsd,
        min_gsd:this.min_gsd,
      };
      const payload = {
        wkt_polygon: this.polygon_wkt
      };
      if (this._zoomed_wkt !== '') {
        queryParams = {...queryParams,  zoomed_wkt: this._zoomed_wkt}
       
        
      } else {
        queryParams = {...queryParams,  zoomed_wkt: ''}
      }
      this.loader = true;
      this.ngxLoader.start(); // Start the loader
      this.page_number = '1';
      this.getSatelliteCatalog(payload, queryParams);
    }, 800);
     // Debounce time: 600ms
  }
  this.setDynamicHeight();
  window.addEventListener('resize', this.setDynamicHeight.bind(this))
  const div = this.scrollableDiv?.nativeElement;
  this.canTriggerAction = true
  if (div) {
    div.addEventListener('wheel', this.handleWheelEvent);
    console.log('valuevaluevaluevaluevalue', value);
  }
 
}
  
  get zoomed_wkt(): string {
    return this._zoomed_wkt;
  }
  formGroup: FormGroup;
  private _popUpData:any
  @Input()
  set popUpData(value: any) {
    if (value !== this._popUpData && value !== null) {
      this._popUpData = value;
      console.log('popUpData popUpData popUpData popUpData:', this._popUpData);
      this.matchedObject = this.dataSource.data.find(item => item.id === this.popUpData?.id);

      if (this.matchedObject) {
        console.log('Matched Object:', this.matchedObject);
        // Access the matched object's value as needed
       // Replace 'value' with the actual key you need
        this.isRowSelected(this.matchedObject.id)
        this.expandedData(this.matchedObject)
        console.log('Matched Value:', value);
      } else {
       
        console.log('No matching object found');
      }
      
      // Add logic to handle the updated value, e.g., update calculations or UI
    } else {
      this.matchedObject = null
    }
  }

  get popUpData(): any {
    return this._popUpData;
  }

  vendorsList:any[]=['airbus','blacksky','capella','maxar','planet','skyfi-umbra'];
  max_cloud:number = 51
  min_cloud: number = 0;
  options: Options = {
    floor: -2,
    ceil: 51,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '';
      } else if (value === 51) {
        return '';
      }else if (value <= -1) {
        return '';
      }
      return `${value}`; // Default for other values
    },
  };
  max_angle:number = 51;
  min_angle: number = 0;
  angleOptions: Options = {
    floor: 0,
    ceil: 51,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 51) {
        return '50+';
      }
      return `${value}`; // Default for other values
    },
  };
  min_gsd:number =0;
  max_gsd:number =4;
  gsd_options: Options = {
    floor: 0,
    ceil:4,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 4) {
        return '3+';
      }
      return `${value}`; // Default for other values
    },
    
  };
  @ViewChildren('sliderElement') sliderElements!: QueryList<ElementRef>;
  lastMatchId:any = null
  constructor(
    private dialog: MatDialog,
    private sharedService: SharedService,
    private satelliteService:SatelliteService,
    private el: ElementRef, private renderer: Renderer2,
    private cdr:ChangeDetectorRef,
    private ngxLoader: NgxUiLoaderService,
    private overlayContainer: OverlayContainer,
    private fb: FormBuilder
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
        this.formGroup = this.fb.group({
          max_cloud: [100],
          min_cloud:[0],
          max_angle:[],
          min_angle:[],
          min_gsd:[],
          max_gsd:[],
          vendor:[],
          vendorId:[],
          
        });
        this.formGroup.get('end_date')?.valueChanges.subscribe((value) => {
          if (value) {
            const formattedValue = moment(value).format('YYYY-MM-DD HH:mm');
            this.formGroup.get('end_date')?.setValue(formattedValue, {
              emitEvent: false, // Prevent infinite loop
            });
          }
        });
        this.formGroup.get('start_date')?.valueChanges.subscribe((value) => {
          if (value) {
            const formattedValue = moment(value).format('YYYY-MM-DD HH:mm');
            this.formGroup.get('start_date')?.setValue(formattedValue, {
              emitEvent: false, // Prevent infinite loop
            });
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
       let queryParams = this.defaultFilter();
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

  onSortChange(event: { active: string; direction: string }) {
    this.sortData();
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
    this.sharedService.isOpenedEventCalendar$.subscribe((isOpened) => {
      console.log(isOpened,'isOpenedisOpenedisOpened');
      
      this.isEventsOpened = isOpened
    })
    const div = this.scrollableDiv?.nativeElement;

    // Add scroll event listener
  
    div.addEventListener('wheel', this.handleWheelEvent);
    this.sharedService.rowHover$.subscribe((rowHover) => {
      console.log(rowHover,'rowHoverrowHoverrowHoverrowHover');
      
      this.tableRowHovered = rowHover
    })
    this.sharedService.overlayShapeData$.subscribe((overlayShapeData) => {
      if(overlayShapeData.length>1){
        this.overlapListData = overlayShapeData
        const overlayIds = new Set(overlayShapeData.map(item => item.id));
  
    // 2. Find the last matching ID in dataSource.data
    
    for (let i = this.dataSource.data.length - 1; i >= 0; i--) {
      if (overlayIds.has(this.dataSource.data[i].id)) {
        this.lastMatchId = this.dataSource.data[i].id;
        break;
      }
  }
  console.log(this.lastMatchId,'lastMatchIdlastMatchIdlastMatchId');
  // 3. Return the corresponding item from overlayShapeData
   this.lastMatchId 
    ? overlayShapeData.find(item => item.id === this.lastMatchId)
    : null;
      }
      console.log(overlayShapeData,'overlayShapeDataoverlayShapeDataoverlayShapeDataoverlayShapeData');
      
    })
   
    
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
    
    let queryParams: any = this.defaultFilter();
    const payload = {
      wkt_polygon: this.polygon_wkt
    }

      if (activeColumn) {
         queryParams ={
          ...queryParams,
          sort_by:activeColumn,
          sort_order: direction
        }
 
          }   
      this.loader = true
      this.ngxLoader.start(); // Start the loader
      this.getSatelliteCatalog(payload,queryParams)
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
      page_size: '20',
      start_date:this.startDate,
      end_date: this.endDate,
      source: 'library',
      
     
      
    }
    this.formGroup.reset();
    const payload = {
      wkt_polygon: this.polygon_wkt
    }
    this.loader = true
      this.ngxLoader.start(); // Start the loader
    this.getSatelliteCatalog(payload,queryParams)
    this.onFilterset.emit({params: queryParams, payload});
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
      width: "880px",
      maxHeight:'700px',
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
   
    setTimeout(() => {
      if(this.isEventsOpened){
        if(this.polygon_wkt ){
          
          const payload = {
            polygon_wkt: this.polygon_wkt,
            start_date: this.startDate,
            end_date: this.endDate
          }
          
          // Start the loader
         
        
          this.satelliteService.getPolygonCalenderDays(payload).subscribe({
            next: (resp) => {
              this.ngxLoader.stop()
              this.calendarApiData = resp.data;
             
            },
            error: (err) => {
              this.ngxLoader.stop()
              console.error('Error fetching calendar data', err);
              // Hide loader on error
             
            },
            
          });
      }
      }
    },300)

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
      return `${parseFloat((totalCount / 1_000_000_000)?.toFixed(1))}b`; // Billions
    } else if (totalCount >= 1_000_000) {
      return `${parseFloat((totalCount / 1_000_000)?.toFixed(1))}m`; // Millions
    } else if (totalCount >= 1_000) {
      return `${parseFloat((totalCount / 1_000)?.toFixed(1))}k`; // Thousands
    } else {
      return totalCount?.toString(); // Less than 1,000
    }
  }

  getValue(value:any,total:any){
    return value *100 / total
  }

  getFormattedDate(date: Date, centroid?: [number, number]): string {
    
    if (this.selectedZone === 'UTC') {
      // Format date in UTC
      return momentZone(date).utc().format('YYYY-MM-DD');
    } else if (centroid && centroid.length === 2) {
      // Get the time zone based on latitude and longitude
      const [latitude, longitude] = centroid;
      const timeZone = tzLookup(latitude, longitude);
  
      // Format the date based on the calculated time zone
      return momentZone(date).tz(timeZone).format('YYYY-MM-DD');
    } else {
      // Fallback to local time
      return moment(date).local().format('YYYY-MM-DD');
    }
  }
  formatUtcTime(payload) {
    // Check if payload contains valid acquisition_datetime
    if (!payload?.acquisition_datetime) {
      throw new Error('Invalid payload or acquisition_datetime missing');
    }    

    const date = new Date(payload.acquisition_datetime);
  
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date passed');
    }
  
    if (this.selectedZone === 'UTC') {
      return momentZone.utc(date).format('HH:mm [UTC]');
    }
  
    if (this.selectedZone === 'local' && payload.centroid?.length === 2) {
      const [latitude, longitude] = payload.centroid;
  
      try {
        // Get the time zone based on latitude and longitude
        const timeZone = tzLookup(latitude, longitude);
  
        // Convert the time to the local time zone
        const localTime = momentZone(date).tz(timeZone).format('HH:mm');
  
        return localTime;
      } catch (error) {
        console.error('Failed to determine time zone:', error);
        throw new Error('Unable to determine local time');
      }
    }
  
    throw new Error('Invalid selectedZone or centroid information');
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
  const index = this.selectedObjects.findIndex(obj => obj?.id === expandedElement?.id);

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
markerData(data:any){
  this.addMarkerToMap.emit(data)
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
    const notFount2 = document.getElementById('custom')
    const custom = document.getElementById('custom');
    const container = document.getElementById('container');
    
    // Calculate the total height of all the above elements
    const totalHeight = [
      header,
      analyticsData,
      notFound,
      notFount2,
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
  const notFount2 = document.getElementById('custom')
  const custom = document.getElementById('custom');
  const container = document.getElementById('container');
  
  // Calculate the total height of all the above elements
  const totalHeight = [
    header,
    analyticsData,
    notFound,
    notFount2,
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
roundOff(value: number): any {
    return Math.round(value);
}

toDecimal(value:number){
  return value.toFixed(2);
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
getDayOfWeek(date: Date, centroid?: [number, number]): string {
  if (this.selectedZone === 'UTC') {
    // Get day of the week in UTC
    return dayjs(date).utc().format('dddd');
  } else if (centroid && centroid.length === 2) {
    // Get the time zone based on latitude and longitude
    const [latitude, longitude] = centroid;
    const timeZone = tzLookup(latitude, longitude);

    // Format the date based on the calculated time zone
    return momentZone(date).tz(timeZone).format('dddd');
  } else {
    // Fallback to local time
    return moment(date).local().format('dddd');
  }
}

private canTriggerAction = true;
private isAtBottom = false;

//Scroll to bottom event 
private handleWheelEvent = (event: WheelEvent): void => {
  const div = this.scrollableDiv?.nativeElement;


  // Detect if at the bottom
  const isAtBottom = div.scrollTop + div.clientHeight+150 >= div.scrollHeight;
  console.log(isAtBottom,'isAtBottomisAtBottomisAtBottom');
  
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
      let minCloud
      if(this.min_cloud <= -1) {
        minCloud = -1
      } else {
        minCloud = this.min_cloud
      } 
      let queryParams ={
        page_number: this.page_number,
        page_size: this.page_size,
        start_date:this.startDate,
        end_date: this.endDate,
        source: 'library',
        zoomed_wkt:this._zoomed_wkt,
        max_cloud_cover: this.max_cloud,
        min_cloud_cover:minCloud,
        max_off_nadir_angle: this.max_angle === 51 ? 1000: this.max_angle,
        min_off_nadir_angle:this.min_angle,
        vendor_id:this.formGroup.get('vendorId')?.value?this.formGroup.get('vendorId').value:'',
        vendor_name:this.formGroup.get('vendor')?.value?this.formGroup.get('vendor').value?.join(','):'',
        max_gsd:this.max_gsd === 4 ? 1000 : this.max_gsd,
        min_gsd:this.min_gsd,
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
getTimePeriod(datetime: string, centroid?: [number, number]): string {
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
    const [latitude, longitude] = centroid;
    const timeZone = tzLookup(latitude, longitude);
    const hours =centroid.length ? momentZone(datetime).tz(timeZone).hour() : new Date(datetime).getHours();  // Parse the ISO string to a Date object        
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
    return this.selectedObjects?.some(obj => obj?.id === id);
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
  
  sliderShow:boolean = false;
  //Overlay container customization class add functionality
  setClass(){
    const containerElement = this.overlayContainer.getContainerElement();
    containerElement.classList.add('library-overlay-container');
   
  }
  setFilterClass(){
    const containerElement = this.overlayContainer.getContainerElement();
    containerElement.classList.add('filter-overlay-container');
    setTimeout(()=>{
      this.sliderShow = true;
      // Apply styles to each slider element
      const sliders = document.querySelectorAll('.ngx-slider');
    sliders.forEach((slider) => {
      this.renderer.setStyle(slider, 'width', '100%');
    });
    },100)
    
  }

  onMenuClose(){
    this.sliderShow = false;
  }

  //Filter Form submit functionality
  onSubmit() {
    let minCloud
    if(this.min_cloud <= -1) {
      minCloud = -1
    } else {
      minCloud = this.min_cloud
    } 
      const datetime = this.formGroup.value.end_date;
     
     
      const payload = {
        wkt_polygon: this.polygon_wkt
      }
      const queryParams = {
        end_date:this.getDateValue(this.endDate),
        start_date:this.getDateValue(this.startDate),
        max_cloud_cover: this.max_cloud,
        min_cloud_cover:minCloud,
        max_off_nadir_angle: this.max_angle === 51 ? 1000: this.max_angle,
        min_off_nadir_angle:this.min_angle,
        vendor_id:this.formGroup.get('vendorId')?.value?this.formGroup.get('vendorId').value:'',
        vendor_name:this.formGroup.get('vendor')?.value?this.formGroup.get('vendor').value?.join(','):'',
        max_gsd:this.max_gsd === 4 ? 1000 : this.max_gsd,
        min_gsd:this.min_gsd,
      }
      const params = {
        ...queryParams,
        page_number:1,
        page_size:20,
        source:'library',
       
      }
      console.log('Selected Date and Time:', params);
      this.parentFilter.emit(queryParams)
      this.onFilterset.emit({params, payload});
     setTimeout(() => {
      this.loader = true
      this.ngxLoader.start(); // Start the loader
      this.getSatelliteCatalog(payload,params)
     },300)
  }

  //Get Date Value function
  getDateValue(date:any){
    if (!date) {
      return null; // Handle null or undefined input
    }
  
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date'); // Handle invalid date input
    }

    console.log(parsedDate.toISOString(),'parsedDateparsedDateparsedDateparsedDateparsedDateparsedDate');
    const endDateControlValue = this.formGroup.get('end_date')?.value;

if (endDateControlValue) {
  const formattedDate = moment(endDateControlValue).format('YYYY-MM-DD HH:mm');
  console.log('Formatted Date:', formattedDate);
}
  
    return parsedDate.toISOString(); 
  }

  // Custom Validator for Date Format
  dateFormatValidator(format: string) {
    return (control: AbstractControl) => {
      const value = control.value;

      if (!value) {
        return null; // If no value, let `Validators.required` handle it
      }

      const isValidFormat = moment(value, format, true).isValid();

      return isValidFormat ? null : { invalidDateFormat: true };
    };
  }

  //Reset form function

  resetForm(){
    this.formGroup.reset();
  }

  //Hide map menu functionality
  hideMenu(){
    this.sharedService.setRightMenuHide(false)
  }

  //Double Day value function
  getDouble(data){
    return parseFloat(data) + parseFloat(data);
    
  }

  //Getting in view list data funtionality
  getInviewList(count: number): any[] {
    // Return first "count" items from dataSource.data
    return this.dataSource.data.slice(0, count);
  }

  //Get browse tab data 
  getFilteredData() {
    // Make a shallow copy of the original array
    let filteredData = [...this.dataSource.data];

    // Remove the first zoomed_captures_count elements
    filteredData = filteredData.slice(this.zoomed_captures_count);

    // Create a new array excluding elements that are present in overlapListData
    let resultData = [];
    let overlapSet = new Set(this.overlapListData); // Use Set for efficient lookups

    for (let i = 0; i < filteredData.length; i++) {
        if (!overlapSet.has(filteredData[i])) {
            resultData.push(filteredData[i]); // Keep elements that are NOT in overlapListData
        }
    }

    return resultData;
}

//Get overlap data 
getOverlapData(){
  const filteredData = this.dataSource.data.filter((item: any) =>
    this.overlapListData.some((overlapItem: any) => overlapItem.id === item.id)
  );

  return filteredData
}

}
