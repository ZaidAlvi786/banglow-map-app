import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import {MatSliderModule} from '@angular/material/slider';
import { DatepickerDailogComponent } from '../../dailogs/datepicker-dailog/datepicker-dailog.component';
import dayjs from 'dayjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule,MatSliderModule,FormsModule],
  exportAs: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  options = [
    { label: 'Box', value: 'Box', image: 'assets/svg-icons/rectangle-icon.svg' },
    { label: 'Polygon', value: 'Polygon', image: 'assets/svg-icons/polygon-icon.svg' },
  ];
  @Output() drawTypeSelected = new EventEmitter<any>();
  @Output() zoomIn = new EventEmitter<any>();
  @Output() zoomOut = new EventEmitter<any>();
  @Output() dateRangeChanged = new EventEmitter<{ startDate: string, endDate: string }>();
  selectedOption = this.options[0];
  isDropdownOpen = false;
  @Input()longitude:any;
  @Input()latitude:any;
  @Input()zoomLevel:any;
  @Output() zoomLevelChange = new EventEmitter<number>();
  @Output() toggleLayer = new EventEmitter<any>();
  // @Output() sliderZoom = new EventEmitter<any>();
  previousZoomLevel:any = 4
  startDate:any
  endDate:any;
  currentUtcTime:any;
  startTime:any;
  endTime:any;
  showLayers:boolean = false;
  private _snackBar = inject(MatSnackBar);
  @Input() ActiveLayer:string ='OpenStreetMap'
  constructor(private dialog: MatDialog){}



  toggleDropdown() {
    
      this.isDropdownOpen = !this.isDropdownOpen;
    
  }
  
  selectOption(option:any) {
    this.selectedOption = option;
    this.isDropdownOpen = false;
    this.drawTypeSelected.emit(option.value);
  }

  // opening range date picker dialog to get start date and end date.
  openDateDailog() {
    const combinedDateTimeString = this.startDate && this.startTime 
    ? `${this.startDate} ${this.startTime}` 
    : null;
    const startDate = combinedDateTimeString 
    ? dayjs(combinedDateTimeString, 'MM.DD.YYYY HH:mm:ss') 
    : null;

// Combine and conditionally set endDate
    const combinedDateTimeEnding = this.endDate && this.endTime 
    ? `${this.endDate} ${this.endTime}` 
    : null;
    const endDate = combinedDateTimeEnding 
    ? dayjs(combinedDateTimeEnding, 'MM.DD.YYYY HH:mm:ss') 
    : null;
    const dialogRef = this.dialog.open(DatepickerDailogComponent, {
      width: '470px',
      data:{startDate:startDate ? startDate :null,endDate:endDate ? endDate:null}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Selected date range:', result);
        this.startDate = result.startDate;
        this.endDate  = result.endDate;
        this.currentUtcTime = result.currentUtcTime;
        this.startDate = result.startDate.format('MM.DD.YYYY');
        this.startTime = result.startDate.format('HH:mm:ss');
        this.endDate = result.endDate.format('MM.DD.YYYY');
        this.endTime = result.endDate.format('HH:mm:ss');
        this.dateRangeChanged.emit({ startDate:result.startDate , endDate:  result.endDate});
        // console.log("Date:", date);
        // Do something with the result
        // For example: this.startDate = result.startDate; this.endDate = result.endDate;

      }
    });
  }

  //Map zoom in and out functions
  zoomMap(type:string){
    if(type ==='zoomIn'){
      this.zoomIn.emit()
    }else if(type ==='zoomOut'){
      this.zoomOut.emit()
    } else{
      //Map zooming level functionality
     this.zoomLevelChange.emit(this.zoomLevel);
      // this.sliderZoom.emit()
    }
  }

  //Map zoom level using slider

  //Date formating
  getFormattedDate(date: Date): string {
    return dayjs(date).format('MM.DD.YYYY');
  }

  //UTC format date function
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

  layerDropdown(){
    this.showLayers = !this.showLayers
  }
  selectedLayer(type:string){
    console.log(type);
    this.toggleLayer.emit(type)
  }
  
}


