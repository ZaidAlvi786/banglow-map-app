import { CommonModule } from "@angular/common";
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  input,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SharedService } from "../shared/shared.service";
import { NotificationsComponent } from "../notifications/notifications.component";
import { OverlayContainer } from "@angular/cdk/overlay";
import { MatMenuModule } from "@angular/material/menu";
// import { LoadingBarComponent } from "../shared/loading-bar";
declare var google: any;

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, FormsModule,NotificationsComponent,MatMenuModule],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent implements OnInit,OnChanges {
  @Input() toggleDrawer?: () => void;
  @Output() toggleEvent = new EventEmitter<string>();
  @Input() drawerStatus:any
  @ViewChild("searchInput", { static: true }) searchInput!: ElementRef;
  @Output() searchEvent = new EventEmitter<google.maps.places.PlaceResult>();

  private autocomplete!: google.maps.places.Autocomplete;
  private _isDrawerOpen: boolean = false;
  constructor(private sharedService:SharedService,private overlayContainer: OverlayContainer){

  }
  @Input()
  set isDrawerOpen(value: boolean) {
    this._isDrawerOpen = value;
   
  }

  get isDrawerOpen(): boolean {
    return this._isDrawerOpen;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isDrawerOpen']) {
      if(changes['isDrawerOpen'].currentValue == false){
        this.toggleType =''
  
      }
    }
    
  }
  private ngZone = inject(NgZone);
  searchQuery: string = "";
@Input() toggleType:string=''
  ngOnInit(): void {
    this.initializeAutocomplete();
  }

 onToggleDrawer(type: string): void {
  // If the drawer is already open and the same type is clicked, do nothing
  
  if(this.toggleType !== type){
    this.sharedService.setIsOpenedEventCalendar(false);
    this.toggleType = type;
    this.isDrawerOpen = true;
    this.toggleEvent.emit(this.toggleType);
    if (this.toggleDrawer) {
      this.toggleDrawer();
    }
  } else {
    this.toggleType = ''
    this.toggleEvent.emit(this.toggleType);
    if (this.toggleDrawer) {
      this.toggleDrawer();
    }
  }

  // Update the type and ensure the drawer remains open
 
}

private initializeAutocomplete() {

  const input = this.searchInput.nativeElement;

  // Initialize Google Maps Places Autocomplete
  this.autocomplete = new google.maps.places.Autocomplete(input, {
    types: ["geocode"], // Adjust this if needed
  });

  // Add listener for place selection
  this.autocomplete.addListener("place_changed", () => {
    this.ngZone.run(() => {
      const place: google.maps.places.PlaceResult = this.autocomplete.getPlace();

      if (place && place.geometry) {
        // If a valid place is selected
        const lat = place.geometry.location?.lat();
        const lng = place.geometry.location?.lng();

        this.searchEvent.emit(place);
      } else {
        // If no place is selected, validate and parse coordinate input
        const inputValue = input.value;
        this.handleCoordinateInput(inputValue);
      }
    });
  });
}

/**
 * Validates and handles coordinate input in both DMS and Decimal formats
 */
private handleCoordinateInput(input: string) {
  const dmsRegex = /^(\d{1,3})°(\d{1,2})'(\d{1,2}(\.\d+)?)["']?\s*([NSEW])\s*,?\s*(\d{1,3})°(\d{1,2})'(\d{1,2}(\.\d+)?)["']?\s*([NSEW])$/;
  const decimalRegex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;

  let latitude: number | undefined;
  let longitude: number | undefined;

  if (dmsRegex.test(input)) {
    // Parse DMS coordinates
    const matches = dmsRegex.exec(input);
    latitude = this.convertDMSToDecimal(matches![1], matches![2], matches![3], matches![5]);
    longitude = this.convertDMSToDecimal(matches![6], matches![7], matches![8], matches![10]);
  } else if (decimalRegex.test(input)) {
    // Parse Decimal coordinates
    [latitude, longitude] = input.split(',').map(coord => parseFloat(coord.trim()));
  } else {
    console.error("Invalid coordinate format");
    return;
  }

  if (latitude !== undefined && longitude !== undefined) {

    // Construct a minimal PlaceResult object
    const place: google.maps.places.PlaceResult = {
      geometry: {
        location: new google.maps.LatLng(latitude, longitude),
      },
      name: `${latitude}, ${longitude}`, // Optional: Display coordinates as the name
      formatted_address: `${latitude}, ${longitude}`, // Optional: Use coordinates as address
    };

    this.searchEvent.emit(place);
  }
}


/**
 * Converts DMS coordinates to Decimal Degrees
 */
private convertDMSToDecimal(degrees: string, minutes: string, seconds: string, direction: string): number {
  let decimal = parseInt(degrees) + parseInt(minutes) / 60 + parseFloat(seconds) / 3600;
  if (direction === 'S' || direction === 'W') {
    decimal *= -1;
  }
  return decimal;
}


  hideMenu(){
    this.sharedService.setRightMenuHide(false)
  }

  setClass(){
    const classesToRemove = ['site-menu', 'filter-overlay-container','library-overlay-container','imagery-filter-container','column-menu','custom-menu-container','log-view-menu'];
    const containerElement = this.overlayContainer.getContainerElement();
    containerElement.classList.remove(...classesToRemove);
    containerElement.classList.add('notification-container');  
  }
}
