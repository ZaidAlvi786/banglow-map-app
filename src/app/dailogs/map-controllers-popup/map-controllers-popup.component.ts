import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-map-controllers-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-controllers-popup.component.html',
  styleUrl: './map-controllers-popup.component.scss'
})
export class MapControllersPopupComponent implements OnInit {
// @Input() data: any;
selectedTimeFrame:string = '24h'
  constructor(@Inject(MAT_DIALOG_DATA) public data: any){}

  ngOnInit(): void {
    console.log(this.data,'datataatatatatatattat');
    
  }
  activeTimeFrame(time:string){
    this.selectedTimeFrame = time;
  }

}
