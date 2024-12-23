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

export class Group {
  name?: string;
  icon?: string; // icon name for Angular Material icons
  children?: Group[]; // nested groups
}

export interface PeriodicElement {
  select: boolean;
  Date: string;
  time: string;
  Sensor: string;
  Vendor: string;
  Cover: string;
  Resolution: string;
  type: string;
  Id: string;
  sun_elevation: string;
  area: number;
  geo_reference: boolean;
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
    GroupsListComponent
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
  dataSource :any=[];
  displayedColumns: string[] = [
    "selectDate",
    "Sensor",
    "Vendor",
    "Cover",
    "Resolution",
    "type",
    "Id",
  ];

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
  @Input() endDate:any
  @Input() startDate:any
  constructor(
    private dialog: MatDialog,
    private sharedService: SharedService,
     private satelliteService:SatelliteService,
     private el: ElementRef, private renderer: Renderer2
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
        page_size: '100',
        start_date:this.startDate,
        end_date: this.endDate,
        source: 'library'
      }
      const payload = {
        wkt_polygon: this.polygon_wkt
      }
     
      this.satelliteService.getDataFromPolygon(payload,queryParams).subscribe({
        next: (resp) => {
          console.log(resp,'queryParamsqueryParamsqueryParamsqueryParams');
          this.dataSource = resp.data
          
        },
        error: (err) => {
          console.log("err getPolyGonData: ", err);
        },
      });
    }
    this.setDynamicHeight();
    window.addEventListener('resize', this.setDynamicHeight.bind(this))
  }

  ngAfterViewInit(): void {
    this.setDynamicHeight();
    window.addEventListener('resize', this.setDynamicHeight.bind(this))
  }
  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  closeLibraryDrawer() {
    this.closeDrawer.emit(true);
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
    this.viewType = type;
  }

  openImagePreviewDialog(index:any) {
    const dialogRef = this.dialog.open(ImagePreviewComponent, {
      width: "880px",
      maxHeight:'694px',
      data:  {images:this.dataSource, currentIndex:index} ,
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
      return dayjs(date).format('MM.DD.YYYY');
  }
  formatUtcTime(payload: string | Date): string {
    // If payload is a string, convert it to Date first
    const date = new Date(payload);
  
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date passed');
    }
  
    // Get the UTC hours and minutes
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  
    // Return formatted time in "HH:mm UTC" format
    return `${hours}:${minutes} UTC`;
  }
  imageHoverView(data:any){
    console.log(data,'datadatadatadatadatadata');
    
    this.imageHover = data
    if (data !== null && !this.vendorData) {
      let queryParams ={
        page_number: '1',
        page_size: '100',
        start_date:'',
        end_date: '',
        vendor_id:data.vendor_id
      }
      this.satelliteService.getDataFromPolygon('',queryParams).subscribe({
        next: (resp) => {
          console.log(resp,'queryParamsqueryParamsqueryParamsqueryParams');
          this.vendorData = resp.data[0]
          
        },
        error: (err) => {
          console.log("err getPolyGonData: ", err);
        },
      });
    } else {
      this.vendorData = null
    }
  }
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

expandedData(data:any,expandedElement:any){
  console.log(expandedElement,'expandedElementexpandedElementexpandedElement');
  if(expandedElement !== null){
    this.notifyParent.emit(data)
  } else {
    this.notifyParent.emit(null)
  }
}

setDynamicHeight(): void {
  // Get the height of the elements above
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
  const remainingHeight = viewportHeight - totalHeight - 400;

  // Get the content div and apply the calculated height
  const contentDiv = this.el.nativeElement.querySelector('.content');
  if (contentDiv) {
    this.renderer.setStyle(contentDiv, 'height', `${remainingHeight}px`);
  }
}
ngOnDestroy(): void {
  window.removeEventListener('resize', this.setDynamicHeight.bind(this));  // Clean up event listener
}

}
