import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  effect,
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
  ViewEncapsulation,
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
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from "rxjs";
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
import { CommonDailogsComponent } from "../../dailogs/common-dailogs/common-dailogs.component";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {WmtsService} from "../../services/wmts.service"
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
    UtcDateTimePipe,
    MatSlideToggleModule
],
providers: [provideNativeDateAdapter()],
  templateUrl: "./library.component.html",
  styleUrl: "./library.component.scss",
  // encapsulation: ViewEncapsulation.None,
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
  
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;  // Get menu trigger reference

  @ViewChild('menuFilterTrigger') menuFilterTrigger!: MatMenuTrigger;

  private satelliteService = inject(SatelliteService);

  //#region Decorators
  @ViewChild("myTemplate", { static: true }) myTemplate!: TemplateRef<any>;
  @Output() closeDrawer = new EventEmitter<boolean>();
  @Input() polygon_wkt:any=null;
  @Input() original_wkt:any=null;
  @Input() sidebarWidth:any;
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
  columns:any = [
    { id: 'acquisition_datetime', displayName: 'Date', visible: true },
    { id: 'vendor_name', displayName: 'Vendor', visible: true },
    { id: 'constellation', displayName: 'Constellation', visible: true },
    { id: 'is_purchased', displayName: 'Purchase', visible: true },
    { id: 'cloud_cover', displayName: 'Clouds', visible: true },
    { id: 'gsd', displayName: 'Resolution', visible: true },
    { id: 'holdback_seconds', displayName: 'Holdback', visible: true },
    { id: 'type', displayName: 'Type', visible: true },
    { id: 'vendor_id', displayName: 'ID', visible: true },
  ];
  
  get displayedColumns(): any {
    
      if(this.sharedService.libraryColumns()!==null){
        this.columns = this.sharedService.libraryColumns();
        this.filteredColumns = this.columns
        return [...this.columns.filter(c => c.visible).map(c => c.id),
          'expand' // Keep expand column always visible
        ];
        
      } else {
        return [...this.columns.filter(c => c.visible).map(c => c.id),
          'expand' // Keep expand column always visible
        ];
      }
      
  }
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
  @Output() notifyParent: EventEmitter<any> = new EventEmitter();
  @Output() addMarkerToMap: EventEmitter<any> = new EventEmitter();
  @Output() parentFilter:EventEmitter<any> = new EventEmitter();
  @Output() onFilterset: EventEmitter<any> = new EventEmitter();
  private _startDate: any;
  private _endDate: any;
  matchedObject:any;
  overlapListData:any=[];
  idArray:string[]=[""]
  filterParams:any;
  isDialogOpen: boolean = false;


  defaultFilter() {
    return {
      page_number: '1',
      page_size: '100',
      start_date:this.startDate,
      end_date: this.endDate,
      source: 'library',
      zoomed_wkt:this._zoomed_wkt,
      focused_records_ids:this.idArray,
      
    }
  }
  @Input()
  set startDate(value: any) {    
    if (!(value !== this._startDate && this.endDate !== this._endDate) || (value !== this._startDate)) {
            
      this._startDate = value;
      let queryParams = {...this.filterParams, 
        page_number: '1',
        page_size: '100',
        start_date: this._startDate,
        source: 'library',
        focused_records_ids: this.idArray,
        end_date: this._endDate};
        
      const payload = {
        wkt_polygon: this.polygon_wkt,
        // original_polygon:this.original_wkt
      }
      
      if (this.polygon_wkt) {
        setTimeout(() => {
          const payload = {
            wkt_polygon: this.polygon_wkt,
            original_polygon:this.original_wkt
          }
        if(this.isEventsOpened){
          
          const calendarPayload ={
            polygon_wkt: this.polygon_wkt,
            start_date: this.startDate,
            end_date: this.endDate,
            original_polygon:this.original_wkt
        }
          
          // Start the loader
         
        
          this.satelliteService.getPolygonCalenderDays(calendarPayload,queryParams).subscribe({
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
     
          } else {
            this.loader = true;
            this.ngxLoader.start();
            this.getSatelliteCatalog(payload,queryParams)

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
      // Add logic to handle the updated value, e.g., update calculations or UI
    } else {
      
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
  page_size = '100';
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
  focused_captures_count:any;
  @Input()
set zoomed_wkt(value: string) {
  console.log("vvvvv", this._zoomed_wkt, value);
  
  if (value !== this._zoomed_wkt) {
    this._zoomed_wkt = value;

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
        ...this.filterParams,
        page_number: '1',
        page_size: this.page_size,
        start_date: this.startDate,
        end_date: this.endDate,
        source: 'library',
        focused_records_ids: this.idArray
      };
      const payload = {
        wkt_polygon: this.polygon_wkt,
        original_polygon:this.original_wkt
      };
      if(this._zoomed_wkt !== this.sharedService.zoomed_wkt()){
      if (this._zoomed_wkt !== ''&& this.isRefresh) {
        this.sharedService.zoomed_wkt.set(this._zoomed_wkt)
        queryParams = {...queryParams,  zoomed_wkt: this._zoomed_wkt}
      } else {
        this.sharedService.zoomed_wkt.set('')
        queryParams = {...queryParams,  zoomed_wkt: ''}
      }
      if(this.polygon_wkt && this.sharedService.shapeDrawStatus()){
        const data = { polygon_wkt: this.polygon_wkt };
        this.satelliteService.getPolygonSelectionAnalytics(data).subscribe({
          next: (res) => {
            this.analyticsData = res?.data?.analytics
            this.percentageArray = Object.entries(this.analyticsData?.percentages).map(([key, value]) => ({
              key,
              ...(value as object),
            }));
          }
        })
         this.filterParams = this.defaultFilter();
        const payload = {
          wkt_polygon: this.polygon_wkt
        }
        this.sharedService.shapeDrawStatus.set(false)
      }
      if(this.isRefresh){
      this.loader = true;
      this.ngxLoader.start(); // Start the loader
      this.page_number = '1';
      this.filterParams = {...queryParams}
        this.getSatelliteCatalog(payload, queryParams);
      }
    } else {
      if(this.isRefresh){
        this.loader = true;
        this.ngxLoader.start(); 
        this.selectedZone = this.sharedService.selectedTimeZone()
        console.log(this.sharedService.libraryColumns(),'libraryColumnslibraryColumnslibraryColumnslibraryColumnslibraryColumns');
        
        this.getSignalValues()
        this.loader = false;
        this.ngxLoader.stop(); 
      }
      
       
    }
      if (this.isRefresh && this.scrollableDiv) {
        this.scrollableDiv.nativeElement.scrollTop = 0;
      }
    }, 800);
     // Debounce time: 600ms
  
  this.setDynamicHeight();
  window.addEventListener('resize', this.setDynamicHeight.bind(this))
  const div = this.scrollableDiv?.nativeElement;
  this.canTriggerAction = true
  console.log('lllllllllllll');
  
  if (div) {
    div.addEventListener('wheel', this.handleWheelEvent);
  }
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
      this.matchedObject = this.dataSource.data.find(item => item.id === this.popUpData?.id);

      if (this.matchedObject) {
        // Access the matched object's value as needed
       // Replace 'value' with the actual key you need
        this.isRowSelected(this.matchedObject.id)
        this.expandedData(this.matchedObject)
      } else {
       
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
  typesList:any[]=['morning','midday','evening','overnight'];
  // Default values for manual filters
  defaultMinCloud = -10;
  defaultMaxCloud = 60;
  defaultMinAngle = 0;
  defaultMaxAngle = 55;
  defaultMinGsd = 0;
  defaultMaxGsd = 4;
  defaultMinAzimuthAngle = 0;
  defaultMaxAzimuthAngle = 365;
  defaultMinholdbackSecond = -73;
  defaultMaxHoldbackSecond = 438;
  defaultMinIlluminationAzimuthAngle = 0;
  defaultMaxIlluminationAzimuthAngle = 365;
  defaultMinIlluminationElevationAngle = 0;
  defaultMaxIlluminationElevationAngle = 365;
  max_cloud:number = this.defaultMaxCloud
  min_cloud: number = this.defaultMinCloud;
  options: Options = {
    step: 10,
    showTicks: true,
    floor: -10,
    ceil: 60,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 60) {
        return '50+';
      } else if (value == -10 && LabelType.Low == label) {                
        return 'SAR';
      }else if (value == -10) {                
        return '';
      }
      return `${value}%`; // Default for other values
    },
  };
  max_angle:number = this.defaultMaxAngle;
  min_angle: number = this.defaultMinAngle;
  min_azimuth_angle:number = this.defaultMinAzimuthAngle;
  max_azimuth_angle:number = this.defaultMaxAzimuthAngle;
  min_holdback_seconds:number = this.defaultMinholdbackSecond;
  max_holdback_seconds:number = this.defaultMaxHoldbackSecond;
  min_illumination_azimuth_angle:number = this.defaultMinIlluminationAzimuthAngle;
  max_illumination_azimuth_angle:number = this.defaultMaxIlluminationAzimuthAngle;
  min_illumination_elevation_angle:number = this.defaultMinIlluminationElevationAngle;
  max_illumination_elevation_angle:number = this.defaultMaxIlluminationElevationAngle;
  angleOptions: Options = {
    step: 5,
    showTicks: true,
    floor: 0,
    ceil: 55,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 55) {
        return '50+';
      }
      return `${value}°`; // Default for other values
    },
  };
  azimuthOptions: Options = {
    step: 10,
    showTicks: true,
    floor: 0,
    ceil: 365,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 365) {
        return '360+';
      }
      return `${value}°`; // Default for other values
    },
  };
  holdbackOptions: Options = {
    step: 60,
    showTicks: true,
    floor: -1,
    ceil: 365,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 438) {
        return '365+';
      }
      return `${value}°`; // Default for other values
    },
  };
  illuminationAzimuthOptions: Options = {
    step: 10,
    showTicks: true,
    floor: 1,
    ceil: 365,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 365) {
        return '360+';
      }
      return `${value}°`; // Default for other values
    },
  };
  illuminationElevationOptions: Options = {
    step: 10,
    showTicks: true,
    floor: 1,
    ceil: 365,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 365) {
        return '360+';
      }
      return `${value}°`; // Default for other values
    },
  };
  min_gsd:number =this.defaultMinGsd;
  max_gsd:number =this.defaultMaxGsd;
  gsd_options: Options = {
    step: 0.1,
    showTicks: true,
    floor: 0,
    ceil:4,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 4) {
        return '3+';
      }
      return `${value}m`; // Default for other values
    },
    
  };
  @ViewChildren('sliderElement') sliderElements!: QueryList<ElementRef>;
  searchQuery = '';
  searchSubject$ = new Subject<string>();
  filteredColumns = this.columns;
  lastMatchId:any = null
  isRefresh: boolean = true;
  constructor(
    private dialog: MatDialog,
    private sharedService: SharedService,
    private el: ElementRef, private renderer: Renderer2,
    private cdr:ChangeDetectorRef,
    private ngxLoader: NgxUiLoaderService,
    private overlayContainer: OverlayContainer,
    private fb: FormBuilder,
    private WmtsService:WmtsService
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
            this.groups = resp?.data;
          },
          error: (err) => {
            console.error('API call failed', err);
          }
        });
        this.formGroup = this.fb.group({
          vendor:[],
          type: [],
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
        this.searchSubject$.pipe(
          debounceTime(300),
          distinctUntilChanged()
        ).subscribe(query => {
          this.filterColumns(query);
        });

        effect(()=>{
          if(this.sharedService.shapeType()!==null && this.polygon_wkt!==null){
           const queryParams = {...this.filterParams,  zoomed_wkt: this._zoomed_wkt}
            const payload = {
              wkt_polygon: this.polygon_wkt,
              original_polygon:this.original_wkt
            };
            this.loader = true;
            this.ngxLoader.start();
            this.getSatelliteCatalog(payload, queryParams);
            this.sharedService.shapeType.set(null)
          }
        },this.polygon_wkt)

        effect(()=>{
          console.log('qqqqqqqqqqqqqqqq');
          
          this.sharedService.libraryColumns.set(this.displayedColumns)
        },this.displayedColumns)

        effect(() => {
          const refreshInfo =  this.sharedService.refreshList()
       console.log(refreshInfo,'refreshInforefreshInforefreshInforefreshInfo');
       
       if(refreshInfo){
        this.sharedService.isOpenedEventCalendar$.subscribe((state) => {
    
         
            if(this.polygon_wkt ){
              let queryParams: any = {
                ...this.filterParams,
                page_number: '1',
                page_size: this.page_size,
                start_date: this.startDate,
                end_date: this.endDate,
                source: 'library',
                focused_records_ids: this.idArray
              };
              this.filterParams = queryParams
              this.formGroup.reset();
              const payload = {
                wkt_polygon: this.polygon_wkt,
                original_polygon:this.original_wkt
              }
          
              const calendarPayload ={
                  polygon_wkt: this.polygon_wkt,
                  start_date: this.startDate,
                  end_date: this.endDate,
                  original_polygon:this.original_wkt
              }
             if(this.isEventsOpened){
              this.getCalendarData(calendarPayload,this.filterParams)
            }
            // if(state){
            //    const payload = {
            //   polygon_wkt: this.polygon_wkt
            // }
            //   this.satelliteService.getPolygonCalenderDays(payload).subscribe({
            //     next: (resp) => {
            //       console.log(resp,'getPolygonCalenderDaysgetPolygonCalenderDaysgetPolygonCalenderDays');
                  
            //     }})
            // }
          }
          
        });
        let queryParams: any = {
          ...this.filterParams,
          page_number: '1',
          page_size: this.page_size,
          start_date: this.startDate,
          end_date: this.endDate,
          source: 'library',
          focused_records_ids: this.idArray
        };
        const payload = {
          wkt_polygon: this.polygon_wkt,
          original_polygon:this.original_wkt
        };
        if (this._zoomed_wkt !== '') {
          queryParams = {...queryParams,  zoomed_wkt: this._zoomed_wkt}
        } else {
          queryParams = {...queryParams,  zoomed_wkt: ''}
        }
      
        this.loader = true;
        this.ngxLoader.start(); // Start the loader
        this.page_number = '1';
        this.filterParams = {...queryParams}
         
          const data = { polygon_wkt: this.polygon_wkt };
          this.satelliteService.getPolygonSelectionAnalytics(data).subscribe({
            next: (res) => {
              this.analyticsData = res?.data?.analytics
              this.percentageArray = Object.entries(this.analyticsData?.percentages).map(([key, value]) => ({
                key,
                ...(value as object),
              }));
            }
          })
          this.getSatelliteCatalog(payload, queryParams);
       }
       
      
        });
        
  }

  ngOnInit() {
   
    this.renderGroup = this.myTemplate;

    // this.sharedService.isOpenedEventCalendar$.subscribe(resp=>this.isEventsOpened=resp)
    if(this.polygon_wkt && this.sharedService.analyticsData() == null) {
      const data = { polygon_wkt: this.polygon_wkt };

//       let geoJSON: any = wktToGeoJSON(this.polygon_wkt);

// // 🔹 Step 1: Get the min/max longitude of the polygon
// const longitudes = geoJSON.coordinates[0].map(([lng]) => lng);
// const minLng = Math.min(...longitudes);
// const maxLng = Math.max(...longitudes);

// // 🔹 Step 2: If the polygon crosses 180°, shift it westward
// if (maxLng > 180) {
//   geoJSON.coordinates = geoJSON.coordinates.map((ring: number[][]) =>
//     ring.map(([lng, lat]) => {
//       return [lng - 360, lat]; // Shift entire polygon left
//     })
//   );
// }

// // Convert back to WKT
// const normalizedWKT = geojsonToWKT(geoJSON);

// console.log("✅ Correctly Normalized WKT:", normalizedWKT);
// console.log(normalizedWKT,'normalizedWktnormalizedWktnormalizedWkt');

//       const data = { polygon_wkt: normalizedWKT };
      this.satelliteService.getPolygonSelectionAnalytics(data).subscribe({
        next: (res) => {
          this.analyticsData = res?.data?.analytics
          this.sharedService.analyticsData.set(res?.data?.analytics)
          this.percentageArray = Object.entries(this.analyticsData?.percentages).map(([key, value]) => ({
            key,
            ...(value as object),
          }));
        }
      })
       this.filterParams = this.defaultFilter();
      const payload = {
        wkt_polygon: this.polygon_wkt
      }
      
    } else {
      this.analyticsData = this.sharedService.analyticsData()
      this.percentageArray = Object.entries(this.analyticsData?.percentages).map(([key, value]) => ({
        key,
        ...(value as object),
      }));
    }
    
    if(!this.isRefresh && !this.sharedService.libraryData()){
      const payload = {
        wkt_polygon: this.polygon_wkt,
        original_polygon:this.original_wkt
      };
      let queryParams: any = {
        ...this.filterParams,
        page_number: '1',
        page_size: this.page_size,
        start_date: this.startDate,
        end_date: this.endDate,
        source: 'library',
        focused_records_ids: this.idArray
      };
      this.loader = true;
    this.ngxLoader.start(); // Start the loader
    this.page_number = '1';
    this.filterParams = {...queryParams}
      this.getSatelliteCatalog(payload, queryParams);
    } else {
      this.loader = true;
      this.ngxLoader.start(); 
      this.selectedZone = this.sharedService.selectedTimeZone()
      console.log(this.sharedService.libraryColumns(),'libraryColumnslibraryColumnslibraryColumnslibraryColumnslibraryColumns');
      
      this.getSignalValues()
      this.loader = false;
      this.ngxLoader.stop();
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
    this.sharedService.isOpenedEventCalendar$.subscribe((isOpened) => {
      
      this.isEventsOpened = isOpened
    })
    const div = this.scrollableDiv?.nativeElement;

    // Add scroll event listener
  
    div.addEventListener('wheel', this.handleWheelEvent);
    this.sharedService.rowHover$.subscribe((rowHover) => {
      this.tableRowHovered = rowHover
    })
    this.sharedService.overlayShapeData$.subscribe((overlayShapeData) => {
      if(overlayShapeData?.length>1){
        console.log(overlayShapeData,'overlayShapeDataoverlayShapeDataoverlayShapeDataoverlayShapeData');
        
       this.idArray = overlayShapeData.map((record) => record.id)?.join(',');

        let minCloud
        if(this.min_cloud <= -1) {
          minCloud = -1
        } else {
          minCloud = this.min_cloud
        } 
        let queryParams: any = {
          ...this.filterParams,
          page_number: '1',
          page_size: this.page_size,
          start_date: this.startDate,
          end_date: this.endDate,
          source: 'library'
        };
        
          queryParams = {...queryParams,  focused_records_ids: this.idArray}
          this.filterParams = {...queryParams}
          const payload = {
            wkt_polygon: this.polygon_wkt,
            original_polygon:this.original_wkt
          };
        this.loader = true;
        this.ngxLoader.start(); // Start the loader
        this.page_number = '1';
        this.getSatelliteCatalog(payload, queryParams);
        this.overlapListData = overlayShapeData
        const overlayIds = new Set(overlayShapeData.map(item => item.id));
  
    // 2. Find the last matching ID in dataSource.data
    
    for (let i = this.dataSource.data.length - 1; i >= 0; i--) {
      if (overlayIds.has(this.dataSource.data[i].id)) {
        this.lastMatchId = this.dataSource.data[i].id;
        break;
      }
  }
  // 3. Return the corresponding item from overlayShapeData
   this.lastMatchId 
    ? overlayShapeData.find(item => item.id === this.lastMatchId)
    : null;
      } else {
        this.idArray = []
      }
      
      
      
    })
  //  this.sharedService.drawShape$.subscribe((shape) => {
  //   if(shape){
  //     const payload = {
  //       wkt_polygon: this.polygon_wkt
  //     }
  //    setTimeout(() => {
  //     this.loader = true
  //     this.ngxLoader.start(); // Start the loader
  //     this.getSatelliteCatalog(payload,this.filterParams);
     
  //    },300)
  //   }
    
  //  })
    
    // Add mouse events
  }

  sortData() {
    this.expandedElement = null
    const activeColumn = this.sort.active;
    const direction = this.sort.direction;

    if (!activeColumn || direction === '') {
      return;
    }
    
    let queryParams: any = this.filterParams;
    const payload = {
      wkt_polygon: this.polygon_wkt,
      original_polygon:this.original_wkt
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
    this.satelliteService.getDataFromPolygon(payload,queryParams).subscribe({
      next: (resp) => {
        this.sharedService.refreshList.set(false)
        // console.log(resp,'queryParamsqueryParamsqueryParamsqueryParams');
        this.dataSource.data = resp.data.map((item, idx) => ({
          ...item,
          index: idx
        }));
        this.originalData = [...this.dataSource.data];
       
        this.total_count = resp.total_records
        this.zoomed_captures_count = resp.zoomed_captures_count>0 ? resp.zoomed_captures_count: resp.total_records;
        this.focused_captures_count = resp?.focused_captures_count
        this.setSignalValues()
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
      page_size: '100',
      start_date:this.startDate,
      end_date: this.endDate,
      source: 'library',
      zoomed_wkt: this._zoomed_wkt? this._zoomed_wkt:''

      
     
      
    }
    this.filterParams = queryParams
    
    this.formGroup.reset();
    const payload = {
      wkt_polygon: this.polygon_wkt,
      original_polygon:this.original_wkt
    }

    const calendarPayload ={
        polygon_wkt: this.polygon_wkt,
        start_date: this.startDate,
        end_date: this.endDate,
        original_polygon:this.original_wkt
    }
    this.filterCount = 0;
    this.defaultMinCloud = -10;
    this.defaultMaxCloud = 60;
    this.defaultMinAngle = 0;
    this.defaultMaxAngle = 55;
    this.defaultMinGsd = 0;
    this.defaultMaxGsd = 4;
    this.min_cloud = -10;
    this.max_cloud = 60;
    this.min_gsd = 0;
    this.max_gsd = 4;
    this.min_angle = 0;
    this.max_angle = 55
    this.zoomed_wkt = this.polygon_wkt
    this.loader = true
      this.ngxLoader.start(); // Start the loader
      this.sharedService.libraryFilters.set(queryParams);
      this.sharedService.libraryFilterCount.set(0)
    this.getSatelliteCatalog(payload,{...queryParams, zoomed_wkt: this._zoomed_wkt})
    this.onFilterset.emit({params: {...queryParams, zoomed_wkt: this._zoomed_wkt}, payload});
    if(this.isEventsOpened){
      this.getCalendarData(calendarPayload,queryParams)
    }
   
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
    this.closeOverlay()
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
      width: "1680px",
      maxHeight:'1200px',
      data:  {images:this.dataSource, currentIndex:index} ,
      panelClass: "custom-preview",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
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
            end_date: this.endDate,
            original_polygon:this.original_wkt
          }
          
          // Start the loader
         let queryParams = this.filterParams
        
          this.satelliteService.getPolygonCalenderDays(payload,queryParams).subscribe({
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

  getCalendarData(payload:any,queryParams:any){
    this.satelliteService.getPolygonCalenderDays(payload,queryParams).subscribe({
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
  getFormattedDateTime(date: Date, centroid?: [number, number]): string {
    
    if (this.selectedZone === 'UTC') {
      // Format date in UTC
      return momentZone(date).utc().format('YYYY-MM-DD HH:mm [UTC]');
    } else if (centroid && centroid.length === 2) {
      // Get the time zone based on latitude and longitude
      const [latitude, longitude] = centroid;
      const timeZone = tzLookup(latitude, longitude);
  
      // Format the date based on the calculated time zone
      return momentZone(date).tz(timeZone).format('YYYY-MM-DD HH:mm');
    } else {
      // Fallback to local time
      return moment(date).local().format('YYYY-MM-DD HH:mm');
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
  

  this.satelliteService.addSite(payload).subscribe({
    next: (resp) => {
      this.snackBar.open('Site has been added.', 'Ok', {
        duration: 2000  // Snackbar will disappear after 300 milliseconds
      });
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
  const data = {
    group_name: inputValue
  }
  // this.satelliteService.getGroupsForAssignment(data).subscribe({
  //   next: (resp) => {
  //     console.log(resp,'respresprespresprespresprespresprespresp');

  //     this.groups = resp?.data

  //   }})

  this.searchInput.next(inputValue);
}

// On table row expand click
expandedData(data: any) {
  let expandedElement = data;

  // Initialize the array if it doesn't exist
  if (!this.selectedObjects) {
    this.selectedObjects = [];
  }

  // Check if the object with the given ID already exists in the array
  const index = this.selectedObjects.findIndex(obj => obj?.id === expandedElement?.id);

  if (index === -1) {
    if(data.vendor_name === 'airbus' && data.is_purchased){
      this.satelliteService.setWMTSToken().subscribe(res => {
        this.WmtsService.setWMTSToken(res.data);
        this.selectedObjects.push(expandedElement);
        this.notifyParent.emit(this.selectedObjects);

      }
      )
    } else {
      this.selectedObjects.push(expandedElement);
      this.notifyParent.emit(this.selectedObjects);
    }
   
    // If the object does not exist, push it to the array
  } else {
    // If the object exists, remove it from the array
    this.selectedObjects.splice(index, 1);
    this.notifyParent.emit(this.selectedObjects);
  }

  // Emit the updated array

}
markerData(data:any){
  this.addMarkerToMap.emit(data)
}


//Table Row hover event Emit
onRowHover(data:any){
  if(this.expandedElement==null){
    this.rowHoveredData.emit(data)
  }
}

onRowExpand(row){
  setTimeout(()=>{
    this.rowHoveredData.emit(row)
  },100)
  
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
    const viewportHeight = window.innerHeight-50;
    // Calculate the remaining height for the target div
    const remainingHeight = viewportHeight - totalHeight-106;
  
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
  const viewportHeight = window.innerHeight + 50;

  // Calculate the remaining height for the target div
  const remainingHeight = viewportHeight - totalHeight -150 ;

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
  
  if (this.selectedRow === row) {
    // Uncheck the currently selected checkbox
    this.selectedRow = null;
  } else {
    
    // Select the new checkbox
    this.selectedRow = row;
    const dialogRef = this.dialog.open(MapControllersPopupComponent, {
      width: `300px`,
      height: 'auto',
      data: { type: 'vendor', vendorData: this.selectedRow },
      panelClass: 'checkbox-dialog',
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.selectedRow = null;
      this.vendorData = null;
    });
  }
}
onRefreshCheckboxChange(e:any){
  if(e.checked){
    this.isRefresh = e.checked;
    
  }
  this.snackBar.open(`Refresh library is  ${e.checked ? 'active':'disabled'}`, 'Ok', { duration: 2000 });
}

//Time Zone Change
selectedTimeZone(zone: string){
  this.selectedZone = zone;
  this.sharedService.selectedTimeZone.set(zone);
  this.sharedService.timeZoneActive.set(true)
  this.cdr.detectChanges();
  this.onSubmit(this.filterParams);
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
  
  // Only trigger if at the bottom and trying to scroll down
  if (isAtBottom && event.deltaY > 0 && this.canTriggerAction) {
    
    if (!this.isAtBottom) {
      console.log('aaaaaaaaaaaa');
      
      this.isAtBottom = true; // Lock the event trigger
      //  this.customAction('Scroll beyond bottom');
      let num = parseInt(this.page_number, 10)
    let  new_pageNumber = num + 1 ;
    this.page_number = new_pageNumber.toString()
    if(this.dataSource.data.length<this.total_count){
      let minCloud
      if(this.min_cloud <= -1) {
        minCloud = -1
      } else {
        minCloud = this.min_cloud
      } 
      let queryParams ={
        ...this.filterParams,
        page_number: this.page_number,
        page_size: this.page_size,
        start_date:this.startDate,
        end_date: this.endDate,
        source: 'library',
        zoomed_wkt:this._zoomed_wkt,
      }
      const payload = {
        wkt_polygon: this.polygon_wkt,
        original_polygon:this.original_wkt
      }
     this.loader = true
      this.ngxLoader.start(); // Start the loader
console.log('kkkkkkkkkkkkkkkkkkk');

  this.satelliteService.getDataFromPolygon(payload, queryParams).subscribe({
    next: (resp) => {
     
      const data = resp.data.map((item, idx) => ({
        ...item,
        index: idx
      }));
      this.dataSource.data = this.dataSource.data.concat(data);
      this.originalData = [...this.dataSource.data];
      this.setSignalValues()
      
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
    
    return index;
  }
  
  sliderShow:boolean = false;
  //Overlay container customization class add functionality
  setClass(){
    const classesToRemove = ['column-menu', 'filter-overlay-container','site-menu','custom-menu-container','group-overlay-container','imagery-filter-container','log-view-menu'];
    const containerElement = this.overlayContainer.getContainerElement();
    containerElement.classList.remove(...classesToRemove);
    containerElement.classList.add('library-overlay-container');
   
  }
  setFilterClass(){
    const containerElement = this.overlayContainer.getContainerElement();
    // Remove existing class before adding a new one
    const classesToRemove = ['column-menu', 'library-overlay-container','site-menu','custom-menu-container','group-overlay-container','imagery-filter-container','log-view-menu'];
    containerElement.classList.remove(...classesToRemove);
    containerElement.classList.add('filter-overlay-container');
    containerElement.addEventListener('click', (event:  Event)=> {
      event.stopPropagation()
    })
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

  //Open Map Controller Popup
  openDialog(vendorId:any){
    if (this.isDialogOpen) return;
    this.isDialogOpen = true;
    //calling API by vendorID
    let vendorData:any [] = [];
    let queryParams ={
      page_number: '1',
      page_size: '100',
      start_date:'',
      end_date: '',
      source: 'library',
      vendor_id: vendorId
    }
    this.satelliteService.getDataFromPolygon('', queryParams).subscribe({
      next: (resp) => {
        if (resp?.data && resp.data.length > 0) {
          vendorData = resp.data[0];
          this.sharedService.setVendorData(vendorData);
          this.isDialogOpen = false;
          // Open the dialog after setting vendorData
          // const dialogRef = this.dialog.open(MapControllersPopupComponent, {
          //   width: `300px`,
          //   height: 'auto',
          //   data: { type: 'vendor', vendorData: vendorData },
          //   panelClass: 'custom-dialog-class',
          //   position: { top: '50px', right: '0px' }
          // });
  
          // dialogRef.afterClosed().subscribe((result) => {
          //   this.popUpData = null;
          //   this.isDialogOpen = false;
          // });
        } else {
          console.log('No data found for the given vendor ID');
          this.isDialogOpen = false;
        }
      },
      error: (err) => {
        console.error('API call failed', err);
        this.isDialogOpen = false;
      }
    });
    
  }
  //Filter Form submit functionality
  onSubmit(filters?: any) {
      let timeZone: string;
      if(this.selectedZone === 'local'){
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; 
      }else if(this.selectedZone === 'UTC'){
        timeZone = 'UTC';
      }

      const payload = {
        wkt_polygon: this.polygon_wkt,
        original_polygon:this.original_wkt
      }
      let queryParams: any = {
        ...filters,
        end_date: this.getDateValue(this.endDate),
        start_date: this.getDateValue(this.startDate),
        user_timezone: timeZone,
        focused_records_ids: this.idArray
      };
    
      let filterCount = 0; // Counter for applied filters
    
    
      // Log the number of applied filters
      if (this._zoomed_wkt !== '') {
        queryParams._zoomed_wkt = this.zoomed_wkt
       
        
      } else {
        queryParams._zoomed_wkt = ''
       
      }
      const params = {
        ...queryParams,
        page_number:1,
        page_size: 100,
        source:'library',
       
      }

      const calendarPayload ={
        polygon_wkt: this.polygon_wkt,
        start_date: this.startDate,
        end_date: this.endDate,
        original_polygon:this.original_wkt
    }
      this.filterParams = { ...queryParams}

      this.parentFilter.emit(this.filterParams)
      this.onFilterset.emit({params:  this.filterParams, payload});
     setTimeout(() => {
      this.loader = true
      this.ngxLoader.start(); // Start the loader
      this.getSatelliteCatalog(payload,params)
      this.closeFilterMenu()
     },300)
     if(this.isEventsOpened){
     this.getCalendarData(calendarPayload,params)
     }
  }

  openFilterDialog(){
    
    const data = {filterParams:this.filterParams,type:'filters'}
    const dialogRef = this.dialog.open(CommonDailogsComponent, {
            width: '550px',
            height: 'auto',
            data: data,
            panelClass: 'filter-dialog-class',
          });
          dialogRef.afterClosed().subscribe((result) => {
            if(result.queryParams){
              this.onSubmit(result.queryParams)
              this.sharedService.libraryFilters.set(result.queryParams)
              this.sharedService.libraryFilterCount.set(result?.filterCount)
              this.filterCount = result.filterCount
            }
          })
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

    const endDateControlValue = this.formGroup.get('end_date')?.value;

if (endDateControlValue) {
  const formattedDate = moment(endDateControlValue).format('YYYY-MM-DD HH:mm');
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
  //set column selection menu class
  setColumnMenuClass(){
    const classesToRemove = ['library-overlay-container', 'filter-overlay-container','site-menu','site-menu','custom-menu-container','group-overlay-container','imagery-filter-container','log-view-menu']
    const containerElement = this.overlayContainer.getContainerElement();
    containerElement.classList.remove(...classesToRemove);
    containerElement.classList.add('column-menu');
  }

  //Input column change value function
  onSearchChange(query: string): void {
    this.searchSubject$.next(query);
  }
  
  //Function to get searched column
  private filterColumns(query: string): void {
    this.filteredColumns = this.columns.filter(col => 
      col.displayName.toLowerCase().includes(query.toLowerCase())
    );
   
  }

  //Reset columns to default values
  resetColumns(){
    this.columns.forEach(col => col.visible = true);
    // Clear search query
    this.searchQuery = '';
    // Reset filtered columns to show all
    this.filterColumns('');
    // If you need to reset any other filtering states
    this.filteredColumns = [...this.columns];
    this.sharedService.libraryColumns.set(this.columns)
  }

  //Getting in view list data funtionality
  getInviewList(start: number, count: number): any[] {
    // Return first "count" items from dataSource.data
    return this.dataSource.data.slice(start ?(start+1) :  0, count);
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


  closeFilterMenu() {
    
    if (this.menuFilterTrigger) {
      this.menuFilterTrigger.closeMenu();
    }
  }

  filterCount :any = 0;
  //Filter count function
  updateFilterCount(): void {
    let count = 0;

    // Count values inside the reactive form
    if(this.formGroup.get('vendor').value !== null) count ++;
    if(this.formGroup.get('type').value !== null) count ++;
    if(this.formGroup.get('vendorId').value !== null) count ++;
    
    // Count manually tracked filters **only if they have changed from defaults**
    if (this.max_cloud !== this.defaultMaxCloud || this.min_cloud !== this.defaultMinCloud) count++;
    if (this.min_angle !== this.defaultMinAngle || this.max_angle !== this.defaultMaxAngle) count++;
    if (this.min_gsd !== this.defaultMinGsd || this.max_gsd !== this.defaultMaxGsd) count++;
    this.filterCount = count;
    
  }

  expandRow(vendorId: any) {
    const foundRow = this.dataSource.data.find(v => v.vendor_id === vendorId);
  
    if (foundRow) {
      this.expandedElement = this.expandedElement?.vendor_id === vendorId ? null : foundRow;
  
      setTimeout(() => {
        const rowElement = document.getElementById(`vendor-row-${vendorId}`);
        const tableContainer = document.querySelector('.mat-table-container') as HTMLElement; // Cast to HTMLElement
  
        if (rowElement && tableContainer) {
          const rowPosition = rowElement.offsetTop - tableContainer.offsetTop;
          tableContainer.scrollTo({ top: rowPosition, behavior: 'smooth' });
        }
      }, 100); // Delay for smooth effect
    }
  }
  
  
  
  closeOverlay(){
    this.overlapListData = [];
    setTimeout(() => {
      this.setDynamicHeight();
    window.addEventListener('resize', this.setDynamicHeight.bind(this))
    const div = this.scrollableDiv?.nativeElement;
    this.canTriggerAction = true
    if (div) {
      div.addEventListener('wheel', this.handleWheelEvent);
    }
    }, 0);
    
  }
  holdbackRoundOf(value:number){
    const holdback = Math.floor(value/86400);
    if (holdback > 40 || !value) {
      return 'N/A'
    } 
    return holdback || 0
  }

  //Get signal values
  getSignalValues(){
    this.zoomed_captures_count = this.sharedService.libraryZoomedCount();
    this.focused_captures_count = this.sharedService.libraryFocusCount();
    this.total_count = this.sharedService.libraryTotalCount();
    const data = this.sharedService.libraryData()
    this.dataSource.data = data
    this.page_number = '1';
    this.filterParams = this.sharedService.libraryFilters();
    this.filterCount = this.sharedService.libraryFilterCount();
  }

  //Set signal values
  setSignalValues(){
    this.sharedService.libraryTotalCount.set(this.total_count);
    this.sharedService.libraryZoomedCount.set(this.zoomed_captures_count);
    this.sharedService.libraryFocusCount.set(this.focused_captures_count);
    this.sharedService.libraryData.set(this.dataSource.data);
  }

  checkColumn(){
    console.log(this.columns,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    
    this.sharedService.libraryColumns.set(this.columns)
  }

  gsdRoundOff(value: number): number {
    return Math.ceil(value * 100) / 100;
  }

  imagePreview(data:any,type:any) {
    const dialogRef = this.dialog.open(ImagePreviewComponent, {
      width: "1680px",
      maxHeight:'1200px',
      data:  {images:data, type:type} ,
      panelClass: "custom-preview",
    });
   
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
        }
      });
    }
}
