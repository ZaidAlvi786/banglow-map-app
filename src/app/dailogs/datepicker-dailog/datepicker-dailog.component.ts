import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DateAdapter, MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { CustomDateAdapter } from '../../customFIles/cutom-adaptor';
import { MatFormFieldModule } from '@angular/material/form-field';

const today = new Date();
const month = today.getMonth();
const year = today.getFullYear();
@Component({
  selector: 'app-datepicker-dailog',
  standalone: true,
  imports: [
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatNativeDateModule,
    MatButtonModule,
    MatFormFieldModule,

  ],
  providers: [provideNativeDateAdapter(),{ provide: DateAdapter, useClass: CustomDateAdapter }],
  templateUrl: './datepicker-dailog.component.html',
  styleUrl: './datepicker-dailog.component.scss'
})

export class DatepickerDailogComponent implements OnInit,AfterViewInit  {
  startDate: any = ''; // Initialize with today's date
  endDate: any = '';   // Initialize with today's date
  selectedDate: Date | null = null; // Initialize with today's date
  selected: Date | null = null;
  dateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  campaignOne = new FormGroup({
    start: new FormControl(new Date(year, month, 13)),
    end: new FormControl(new Date(year, month, 16)),
  });
  campaignTwo = new FormGroup({
    start: new FormControl(new Date(year, month, 15)),
    end: new FormControl(new Date(year, month, 19)),
  });
  selectedRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  presets:any[] = [
    { label: '24 Hours', days: 1 },
    { label: '3 Days', days: 3 },
    { label: '7 Days', days: 7 },
    { label: '14 Days', days: 14 },
    { label: '28 Days', days: 28 },
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '9 Months', days: 270 },
  ];
  isSelectingStart = true;
  ngOnInit(): void {
   this.presets = [
    { label: '24 Hours', days: 1 },
    { label: '3 Days', days: 3 },
    { label: '7 Days', days: 7 },
    { label: '14 Days', days: 14 },
    { label: '28 Days', days: 28 },
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '9 Months', days: 270 },
  ]
  }


  constructor(public dialogRef: MatDialogRef<DatepickerDailogComponent>) {}
  @ViewChild(MatDateRangePicker) picker!: MatDateRangePicker<Date>;

  ngAfterViewInit(): void {
    if (this.picker) {
      this.picker.open();
      
    }
  }
  
  onDateChange(date: Date | any): void {
    this.keepPickerOpen();
    if (!this.startDate || (this.startDate && this.endDate)) {
      this.startDate = date;
      this.endDate = null;
    } else if (!this.endDate) {
      this.endDate = date;
    }
    setTimeout(() => this.picker.open(), 0);
  }
  onDateRangeSelected(event: { start: Date | null; end: Date | null }): void {
    this.selectedRange = event;
    // Ensure the picker stays open after selection
    
  }

  selectPreset(days: number): void {
    const now = new Date();
    this.endDate = now;
    this.startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
  keepPickerOpen(): void {
    // Re-open the picker if it gets closed
    setTimeout(() => {
      this.picker.open();
    });
  }

  applyDateRange(): void {
    console.log('Start Date:', this.startDate);
    console.log('End Date:', this.endDate);

    // Pass only valid dates back to the parent component
    if (this.startDate && this.endDate) {
      this.dialogRef.close({ startDate: this.startDate, endDate: this.endDate });
    } else {
      this.dialogRef.close(null); // Close without returning if dates are invalid
    }
  }

  onDateSelected(date: Date | null): void {
    if (!date) {
      return; // Do nothing if date is null
    }
  
    if (this.isSelectingStart) {
      this.dateRange.start = date;
      this.dateRange.end = null; // Reset end date
    } else {
      if (this.dateRange.start && date < this.dateRange.start) {
        // Swap start and end if end date is earlier than start
        this.dateRange.end = this.dateRange.start;
        this.dateRange.start = date;
      } else {
        this.dateRange.end = date;
      }
    }
    this.isSelectingStart = !this.isSelectingStart; // Toggle between start and end selection
  }

  isInRange(date: Date): boolean {
    if (this.dateRange.start && this.dateRange.end) {
      return date >= this.dateRange.start && date <= this.dateRange.end;
    }
    return false;
  }

  isStartDate(date: Date): boolean {
    return this.dateRange.start !== null && date.getTime() === this.dateRange.start.getTime();
  }
  
  isEndDate(date: Date): boolean {
    return this.dateRange.end !== null && date.getTime() === this.dateRange.end.getTime();
  }
  dateClass = (date: Date) => {
    if (this.isStartDate(date)) {
      return 'start-date';
    } else if (this.isEndDate(date)) {
      return 'end-date';
    } else if (this.isInRange(date)) {
      return 'in-range';
    }
    return '';
  };
  
}
