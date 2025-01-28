import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { MatSelectModule } from "@angular/material/select";
import { MatDialog } from "@angular/material/dialog";
import { MatSliderModule } from "@angular/material/slider";
import { DatepickerDailogComponent } from "../../dailogs/datepicker-dailog/datepicker-dailog.component";
import dayjs from "dayjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormsModule } from "@angular/forms";
import { DateFormatPipe, TimeFormatPipe } from "../../pipes/date-format.pipe";
@Component({
  selector: "app-footer",
  standalone: true,
  imports: [
    CommonModule,
    MatSliderModule,
    FormsModule,
    DateFormatPipe,
    TimeFormatPipe,
  ],
  exportAs: "app-footer",
  templateUrl: "./footer.component.html",
  styleUrl: "./footer.component.scss",
})
export class FooterComponent implements OnInit {
  options = [
    {
      label: "Box",
      value: "Box",
      image: "assets/svg-icons/rectangle-icon.svg",
    },
    {
      label: "Polygon",
      value: "Polygon",
      image: "assets/svg-icons/polygon-icon.svg",
    },
  ];
  @Output() drawTypeSelected = new EventEmitter<any>();
  @Output() zoomIn = new EventEmitter<any>();
  @Output() zoomOut = new EventEmitter<any>();
  @Output() dateRangeChanged = new EventEmitter<{
    startDate: string;
    endDate: string;
  }>();
  selectedOption: any = null;
  @Input() isDropdownOpen: boolean = false; // Receiving the dropdown state from the parent
  @Output() toggleDropdownEvent: EventEmitter<boolean> =
    new EventEmitter<boolean>(); // To send state back to parent
  @Input() longitude: any;
  @Input() latitude: any;
  @Input() zoomLevel: any;
  @Output() zoomLevelChange = new EventEmitter<number>();
  @Output() toggleLayer = new EventEmitter<any>();
  // @Output() sliderZoom = new EventEmitter<any>();
  previousZoomLevel: any = 4;
  startDate: any;
  endDate: any;
  currentUtcTime: any;
  startTime: any;
  endTime: any;
  @Input() showLayers: boolean = false;
  @Output() toggleLayersEvent: EventEmitter<boolean> =
    new EventEmitter<boolean>(); // To send state back to parent
  private _snackBar = inject(MatSnackBar);
  @Input() ActiveLayer: string = "OpenStreetMapDark";
  @Input() drawStatus: any;
  // EventEmitter to send the close event to the parent
  constructor(private dialog: MatDialog) {
    const now = dayjs().utc();
    console.log(now.format("YYYY-MM-DD"),'nownownownownow',now.format("HH:mm:ss"));
    
    // Start of yesterday
    this.startDate = now.subtract(1, "day").startOf("day").format("YYYY-MM-DD");
    this.startTime = now.subtract(1, "day").startOf("day").format("HH:mm:ss");

    // Current date and time
    this.endDate = now.format("YYYY-MM-DD");
    this.endTime = now.format("HH:mm:ss");

  }

  ngOnInit(): void {
    const now = dayjs().utc();
    console.log(now.format("YYYY-MM-DD"),'nownownownownow',now.format("HH:mm:ss"));
    // Start of yesterday
    this.startDate = now.subtract(1, "day").startOf("day").format("YYYY-MM-DD");
    this.startTime = now.subtract(1, "day").startOf("day").format("HH:mm:ss");
    
    // Current date and time
    this.endDate = now.format("YYYY-MM-DD");
    this.endTime = now.format("HH:mm:ss");
    
    console.log(this.startDate, "startTimestartTimestartTime");
  }

  toggleDropdown() {
    // Toggle the dropdown and emit the state change to the parent
    this.isDropdownOpen = !this.isDropdownOpen;
    this.toggleDropdownEvent.emit(this.isDropdownOpen);
  }

  selectOption(option: any) {
    this.selectedOption = option;
    // this.isDropdownOpen = false;
    this.drawTypeSelected.emit(option.value);
  }

  // opening range date picker dialog to get start date and end date.
  openDateDailog() {
    if (this.isDropdownOpen) this.isDropdownOpen = false;
    if (this.showLayers) this.showLayers = false;
    console.log(
      this.startDate,
      "combinedDateTimeStringcombinedDateTimeStringcombinedDateTimeString",
      this.startTime
    );
    const now = dayjs().utc();

    const combinedDateTimeString =
      this.startDate && this.startTime
        ? `${this.startDate} ${this.startTime}`
        : null;
    let startDate = combinedDateTimeString
      ? dayjs(combinedDateTimeString, "YYYY-MM-DD HH:mm:ss")
      : null;
    console.log(
      startDate.isValid(),
      "combinedDateTimeStringcombinedDateTimeStringcombinedDateTimeString"
    );

    if (startDate.isValid()) {
      startDate = startDate;
    } else {
      startDate = now.subtract(1, "day").startOf("day");
    }

    // Combine and conditionally set endDate
    const combinedDateTimeEnding =
      this.endDate && this.endTime ? `${this.endDate} ${this.endTime}` : null;
    const endDate = combinedDateTimeEnding
      ? dayjs(combinedDateTimeEnding, "YYYY-MM-DD HH:mm:ss")
      : null;
    const dialogRef = this.dialog.open(DatepickerDailogComponent, {
      width: "470px",
      data: {
        startDate: startDate ? startDate : null,
        endDate: endDate ? endDate : null,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log("Selected date range:", result);
        this.startDate = result.startDate;
        this.endDate = result.endDate;
        this.currentUtcTime = result.currentUtcTime;
        this.startDate = result.startDate.format("YYYY-MM-DD");
        this.startTime = result.startDate.format("HH:mm:ss");
        this.endDate = result.endDate.format("YYYY-MM-DD");
        this.endTime = result.endDate.format("HH:mm:ss");
        this.dateRangeChanged.emit({
          startDate: result.startDate,
          endDate: result.endDate,
        });
        // console.log("Date:", date);
        // Do something with the result
        // For example: this.startDate = result.startDate; this.endDate = result.endDate;
      }
    });
  }

  //Map zoom in and out functions
  zoomMap(type: string) {
    if (type === "zoomIn") {
      this.zoomIn.emit();
    } else if (type === "zoomOut") {
      this.zoomOut.emit();
    } else {
      //Map zooming level functionality
      this.zoomLevelChange.emit(this.zoomLevel);
      // this.sliderZoom.emit()
    }
  }

  //Map zoom level using slider

  //Date formating
  getFormattedDate(date: Date): string {
    return dayjs(date).format("YYYY-MM-DD");
  }

  //UTC format date function
  formatUtcTime(payload: string | Date): string {
    // If payload is a string, convert it to Date first
    const date = new Date(payload);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date passed");
    }

    // Get the UTC hours and minutes
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");

    // Return formatted time in "HH:mm UTC" format
    return `${hours}:${minutes} UTC`;
  }

  layerDropdown() {
    this.showLayers = !this.showLayers;
    this.toggleLayersEvent.emit(this.showLayers);
  }
  selectedLayer(type: string) {
    this.showLayers = false;
    console.log(type);
    this.toggleLayer.emit(type);
  }

  closeDropdown() {
    if (this.isDropdownOpen) this.isDropdownOpen = false;
    if (this.showLayers) this.showLayers = false;
  }

  copyToClipboard(): void {
    const textToCopy = `${this.latitude}, ${this.longitude}`;

    // Create a temporary input element to copy text
    const inputElement = document.createElement("input");
    inputElement.value = textToCopy;
    document.body.appendChild(inputElement);
    inputElement.select();
    document.execCommand("copy");
    document.body.removeChild(inputElement);

    // Optionally alert the user

    this._snackBar.open("Latitude and Longitude copied to clipboard!", "Ok", {
      duration: 2000, // Snackbar will disappear after 300 milliseconds
    });
  }

  onRightClick(event) {
    event.preventDefault() //this will disable default action of the context menu
    //there will be your code for the expected right click action
    this.copyToClipboard()
   }

  @HostListener("contextmenu")
  preventContextMenu() {
    return false;
  }
}
