import { AfterViewInit, Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DateAdapter, MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { CustomDateAdapter } from '../../customFIles/cutom-adaptor';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import moment from 'moment'; 
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
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
    NgxDaterangepickerMd
    

  ],
  providers: [],
  templateUrl: './datepicker-dailog.component.html',
  styleUrl: './datepicker-dailog.component.scss'
})

export class DatepickerDailogComponent implements OnInit,AfterViewInit  {
  @Input() startDate: dayjs.Dayjs = dayjs(); // Initialize with current date
  @Input() endDate: dayjs.Dayjs = dayjs().add(0, 'days'); // Initialize with 1 day later
  selectedDate: Date | null = null; // Initialize with today's date
  dateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  selectedRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  maxDate:any = dayjs();
  isSelectingStart = true;
  currentUtcTime:dayjs.Dayjs = dayjs().utc();
  dateRangeForm: FormGroup;
  @ViewChild('startDateInput') startDateInput!: ElementRef<HTMLInputElement>;
  ngOnInit(): void {
    console.log(this.maxDate,'sssssssssssssssss');
    this.maxDate = this.maxDate.format(('YYYY-MM-DD HH:mm [UTC]'))
    if (this.data.startDate && this.data.endDate) {
      this.startDate = this.data.startDate;
      this.endDate = this.data.endDate;
      this.updateFormValues();
    }
  }

  onSubmit() {
    console.log('Selected Date Range:', this.dateRangeForm.value.dateRange);
  }

  constructor(public dialogRef: MatDialogRef<DatepickerDailogComponent>,private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.dateRangeForm = this.fb.group({
        startDate: [
          this.startDate.format('YYYY-MM-DD HH:mm [UTC]'),
          [Validators.required, this.validateDate.bind(this), this.validateNotFutureDate.bind(this)],
        ],
        endDate: [
          this.endDate.format('YYYY-MM-DD HH:mm [UTC]'),
          [Validators.required, this.validateDate.bind(this), this.validateNotFutureDate.bind(this), this.validateEndAfterStart.bind(this)],
        ],
      });

  }
  ngAfterViewInit(): void {
    
  }
  // This method will be triggered when a date range is selected
  choosedDate(event: any) {
    console.log('Selected Date and Time Range:', event);

    if (event && event.startDate && event.endDate) {
      // Convert the selected startDate and endDate to UTC Dayjs objects
      this.startDate = dayjs(event.startDate).utc();
      this.endDate = dayjs(event.endDate).utc();
  
      // Get the current UTC time in HH:mm UTC format
      //  this.currentUtcTime = dayjs().utc().format('HH:mm [UTC]');
      console.log('Start Date in UTC:', this.startDate.format('YYYY-MM-DD HH:mm [UTC]'));
      console.log('End Date in UTC:', this.endDate.format('YYYY-MM-DD HH:mm [UTC]'));
      console.log('Current UTC Time:', this.currentUtcTime);
  
      // Optional: Automatically apply the date range
      this.autoApplyDateRange();
    }
  }

  autoApplyDateRange() {
    console.log('Auto Applying Date Range with Time:', this.startDate.format('YYYY-MM-DD'), this.endDate.format('YYYY-MM-DD'));
   
  }
  // Helper method to format the date as MM.DD.YYYY
  formatDate(date: any): string {
    const month = (date.month() + 1).toString().padStart(2, '0'); // Add leading zero for single digits
    const day = date.date().toString().padStart(2, '0'); // Add leading zero for single digits
    const year = date.year();

    return `${month}.${day}.${year}`;
  }

  // Optionally, this method can be used to apply the selected date range



  // Function to set the date range based on button clicked
  setDateRange(range: string): void {
    const now = dayjs().utc(); // Get current UTC time as a Dayjs object
  
    switch (range) {
      case '24hours':
        // Start of the previous day
        this.startDate = now.subtract(1, 'day').startOf('day'); 
        // End of the previous day
        this.endDate = now.subtract(1, 'day').endOf('day'); 
        break;
      case '3days':
        // Start of 3 days ago
        this.startDate = now.subtract(3, 'days').startOf('day'); 
        // End of the previous day
        this.endDate = now.subtract(1, 'day').endOf('day'); 
        break;
      case '7days':
        this.startDate = now.subtract(7, 'days').startOf('day');
        this.endDate = now.subtract(1, 'day').endOf('day');
        break;
      case '14days':
        this.startDate = now.subtract(14, 'days').startOf('day');
        this.endDate = now.subtract(1, 'day').endOf('day');
        break;
      case '28days':
        this.startDate = now.subtract(28, 'days').startOf('day');
        this.endDate = now.subtract(1, 'day').endOf('day');
        break;
      case '3months':
        this.startDate = now.subtract(3, 'months').startOf('day');
        this.endDate = now.subtract(1, 'day').endOf('day');
        break;
      case '6months':
        this.startDate = now.subtract(6, 'months').startOf('day');
        this.endDate = now.subtract(1, 'day').endOf('day');
        break;
      case '9months':
        this.startDate = now.subtract(9, 'months').startOf('day');
        this.endDate = now.subtract(1, 'day').endOf('day');
        break;
      default:
        console.error('Invalid range');
        break;
    }
  
    // Ensure startDate and endDate are Dayjs objects in UTC format
    this.startDate = dayjs(this.startDate).utc();
    this.endDate = dayjs(this.endDate).utc();
  
    // Log to check the result
    console.log('Start Date in UTC:', this.startDate.format('YYYY-MM-DD HH:mm [UTC]'));
    console.log('End Date in UTC:', this.endDate.format('YYYY-MM-DD HH:mm [UTC]'));
  
    // Optionally, trigger auto-apply of the date range
    setTimeout(() => {
      this.autoApplyDateRange();
    }, 10);
  }
  

  

  // selectPreset(days: number): void {
  //   const now = new Date();
  //   this.endDate = now;
  //   this.startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  // }

  applyDateRange(): void {
    // console.log('Start Date:', this.startDate);
    // console.log('End Date:', this.endDate);

    // Pass only valid dates back to the parent component
    if (this.startDate && this.endDate) {
      this.dialogRef.close({ startDate: this.startDate, endDate: this.endDate,currentUtcTime:this.currentUtcTime });
    } else {
      this.dialogRef.close(null); // Close without returning if dates are invalid
    }
  }

   // Method to update the form values from the startDate and endDate
   updateFormValues() {
    this.dateRangeForm.patchValue({
      startDate: this.startDate.format('YYYY-MM-DD HH:mm [UTC]'),
      endDate: this.endDate.format('YYYY-MM-DD HH:mm [UTC]')
    });
  }
 // Helper method to get controls safely
  get startDateControl(): FormControl {
    return this.dateRangeForm?.get('startDate') as FormControl;
  }

  get endDateControl(): FormControl {
    return this.dateRangeForm?.get('endDate') as FormControl;
  }


  // Custom validation: Validate if the date is not in the future
  validateNotFutureDate(control: FormControl) {
    const inputDate = dayjs(control?.value, 'YYYY.MM.DD HH:mm [UTC]', true).utc();
    if (inputDate.isAfter(this.maxDate)) {
      return { futureDate: true };
    }
    return null;
  }

  // Custom validation: Validate if the end date is greater than or equal to the start date
  validateEndAfterStart(control: FormControl) {
    const endDate = dayjs(control?.value, 'YYYY-MM-DD HH:mm [UTC]', true).utc();
    const startDate = dayjs(this.dateRangeForm?.get('startDate')?.value, 'YYYY-MM-DD HH:mm [UTC]', true).utc();
  
    if (startDate.isValid() && endDate.isValid() && endDate.isBefore(startDate)) {
      return { endBeforeStart: true };
    }
    return null;
  }

  // Custom validation: Validate the date format
  validateDate(control: FormControl) {
    const isValid = dayjs(control.value, 'YYYY-MM-DD HH:mm [UTC]', true).isValid();
    if (!isValid) {
      return { invalidDateFormat: true };
    }
    return null;
  }


 // Method triggered when the user types a date manually
 onInputChange(field: 'startDate' | 'endDate', event: any) {
  const inputElement = event.target as HTMLInputElement;
  const inputValue = inputElement.value;

  // Parse the entered value
  const parsedDate = dayjs(inputValue, 'YYYY-MM-DD HH:mm [UTC]', true);

  // Temporarily update the form control value to reflect user input
  if (field === 'startDate') {
    this.dateRangeForm.get('startDate')?.setValue(inputValue, { emitEvent: false });
  } else if (field === 'endDate') {
    this.dateRangeForm.get('endDate')?.setValue(inputValue, { emitEvent: false });
  }

  // Apply validation logic
  if (!parsedDate.isValid()) {
    // Set validation error for invalid date format
    this.dateRangeForm.get(field)?.setErrors({ invalidDateFormat: true });
    return;
  }

  // Check for future date
  if (parsedDate.isAfter(this.maxDate)) {
    this.dateRangeForm.get(field)?.setErrors({ futureDate: true });
    return;
  }

  // Additional validation for startDate ≤ endDate
  if (field === 'startDate') {
    const endDate = dayjs(this.dateRangeForm.get('endDate')?.value, 'YYYY-MM-DD HH:mm [UTC]', true);
    if (endDate.isValid() && parsedDate.isAfter(endDate)) {
      this.dateRangeForm.get(field)?.setErrors({ startAfterEnd: true });
      return;
    }
  } else if (field === 'endDate') {
    const startDate = dayjs(this.dateRangeForm.get('startDate')?.value, 'YYYY-MM-DD HH:mm [UTC]', true);
    if (startDate.isValid() && parsedDate.isBefore(startDate)) {
      this.dateRangeForm.get(field)?.setErrors({ endBeforeStart: true });
      return;
    }
  }

  // Clear errors if all validations pass
  this.dateRangeForm.get(field)?.setErrors(null);
}

onInputBlur(field: 'startDate' | 'endDate') {
  const control = this.dateRangeForm.get(field);
  const inputValue = control?.value;
  const parsedDate = dayjs(inputValue, 'YYYY-MM-DD HH:mm [UTC]', true);

  if (!parsedDate.isValid()) {
    // Reset to the last valid value if the date is invalid
    if (field === 'startDate') {
      control?.setValue(this.startDate.format('YYYY-MM-DD HH:mm [UTC]'), { emitEvent: false });
    } else if (field === 'endDate') {
      control?.setValue(this.endDate.format('YYYY-MM-DD HH:mm [UTC]'), { emitEvent: false });
    }
    return;
  }

  // Check for future dates
  if (parsedDate.isAfter(this.maxDate)) {
    if (field === 'startDate') {
      control?.setValue(this.startDate.format('YYYY-MM-DD HH:mm [UTC]'), { emitEvent: false });
    } else if (field === 'endDate') {
      control?.setValue(this.endDate.format('YYYY-MM-DD HH:mm [UTC]'), { emitEvent: false });
    }
    return;
  }

  // Validate startDate ≤ endDate
  if (field === 'startDate') {
    const endDate = dayjs(this.dateRangeForm.get('endDate')?.value, 'YYYY-MM-DD HH:mm [UTC]', true);
    if (endDate.isValid() && parsedDate.isAfter(endDate)) {
      control?.setValue(this.startDate.format('YYYY-MM-DD HH:mm [UTC]'), { emitEvent: false });
      return;
    }
    // Update the valid startDate
    this.startDate = parsedDate.utc();
  } else if (field === 'endDate') {
    const startDate = dayjs(this.dateRangeForm.get('startDate')?.value, 'YYYY-MM-DD HH:mm [UTC]', true);
    if (startDate.isValid() && parsedDate.isBefore(startDate)) {
      control?.setValue(this.endDate.format('YYYY-MM-DD HH:mm [UTC]'), { emitEvent: false });
      return;
    }
    // Update the valid endDate
    this.endDate = parsedDate.utc();
  }
}


updateCalendar() {
  // Logic to refresh the calendar view
  this.startDate = dayjs(this.startDate).utc(); // Ensures the startDate is in UTC format
  this.endDate = dayjs(this.endDate).utc(); // Ensures the endDate is in UTC format
}

  
}
