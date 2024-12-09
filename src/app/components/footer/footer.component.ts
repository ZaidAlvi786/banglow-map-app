import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import {MatSliderModule} from '@angular/material/slider';
import { DatepickerDailogComponent } from '../../dailogs/datepicker-dailog/datepicker-dailog.component';
import dayjs from 'dayjs';
import {MatSnackBar} from '@angular/material/snack-bar';
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule,MatSliderModule],
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
  selectedOption = this.options[0];
  isDropdownOpen = false;
  @Input()longitude:any;
  @Input()latitude:any;
  @Input()zoomLevel:any;
  startDate:any
  endDate:any;
  currentUtcTime:any;
  private _snackBar = inject(MatSnackBar);
  constructor(private dialog: MatDialog){}

  toggleDropdown() {
    if(this.startDate && this.endDate){
      this.isDropdownOpen = !this.isDropdownOpen;
    } else {
      this._snackBar.open('Please first select date range.', 'Ok', {
        duration: 2000  // Snackbar will disappear after 300 milliseconds
      });
    }
    
  }
  
  selectOption(option:any) {
    this.selectedOption = option;
    this.isDropdownOpen = false;
    this.drawTypeSelected.emit(option.value);
  }

  // opening range date picker dialog to get start date and end date.
  openDateDailog() {
    const dialogRef = this.dialog.open(DatepickerDailogComponent, {
      width: '470px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Selected date range:', result);
        this.startDate = result.startDate;
        this.endDate  = result.endDate;
        this.currentUtcTime = result.currentUtcTime;
        // Do something with the result
        // For example: this.startDate = result.startDate; this.endDate = result.endDate;

      }
    });
  }
  zoomMap(type:string){
    if(type ==='zoomIn'){
      this.zoomIn.emit()
    }else{
      this.zoomOut.emit()
    }
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
  
}


