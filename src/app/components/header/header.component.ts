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
// import { LoadingBarComponent } from "../shared/loading-bar";
// declare var google: any;

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  constructor(private sharedService:SharedService,){

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
    console.log('typetypetypetypetypetypetype: ' , type);
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
    console.log('rrrrrrrrrrrrrr');
    
    const input = this.searchInput.nativeElement;
    this.autocomplete = new google.maps.places.Autocomplete(input, {
      types: ["geocode"], // You can adjust this to `['establishment']` or other types
    });

    // Add listener for place selection
    this.autocomplete.addListener("place_changed", () => {
      this.ngZone.run(() => {
        const place: google.maps.places.PlaceResult =
          this.autocomplete.getPlace();
        if (place && place.geometry) {
          // get lat
          const lat = place.geometry.location?.lat();
          // get lng
          const lng = place.geometry.location?.lng();

          console.log("placeplaceplaceplaceplace", place, lng, lat);

          this.searchEvent.emit(place);
        }
      });
    });
  }
}
