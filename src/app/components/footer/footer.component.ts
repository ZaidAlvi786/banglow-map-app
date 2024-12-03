import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import {MatSliderModule} from '@angular/material/slider';
import { DatepickerDailogComponent } from '../../dailogs/datepicker-dailog/datepicker-dailog.component';
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
  constructor(private dialog: MatDialog){}

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  
  selectOption(option:any) {
    this.selectedOption = option;
    this.isDropdownOpen = false;
    this.drawTypeSelected.emit(option.value);
  }
  openDateDailog() {
    const dialogRef = this.dialog.open(DatepickerDailogComponent, {
      width: '470px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Selected date range:', result);
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
}


