import { CommonModule } from "@angular/common";
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LoadingBarComponent } from "../shared/loading-bar";

// declare var google: any;

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, FormsModule,LoadingBarComponent],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent implements OnInit {
  @Input() toggleDrawer?: () => void;
  @Output() toggleEvent = new EventEmitter<string>();

  @ViewChild("searchInput", { static: true }) searchInput!: ElementRef;
  @Output() searchEvent = new EventEmitter<google.maps.places.PlaceResult>();

  private autocomplete!: google.maps.places.Autocomplete;

  private ngZone = inject(NgZone);
  isDrawerOpen: boolean = false;
  searchQuery: string = "";
toggleType:string=''
  ngOnInit(): void {
    this.initializeAutocomplete();
  }

  onToggleDrawer(type: string) {
    this.isDrawerOpen = !this.isDrawerOpen;
    if(this.isDrawerOpen){
      this.toggleType = type;
    } else {
      this.toggleType =''
    }
    
    if (this.toggleDrawer) {
      this.toggleDrawer();
      this.toggleEvent.emit(type);
    }
  }

  private initializeAutocomplete() {
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
