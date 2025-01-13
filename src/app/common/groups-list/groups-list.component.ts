import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import {MatExpansionModule} from '@angular/material/expansion';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { MatMenuModule } from '@angular/material/menu';
@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [CommonModule,MatExpansionModule,DateFormatPipe,MatMenuModule],
  templateUrl: './groups-list.component.html',
  styleUrl: './groups-list.component.scss'
})
export class GroupsListComponent {
  @Input() group: any; // Current group data
  isExpanded = false; // Tracks expand/collapse state
  @Input() backgroundColor: string = '#191E22';
  @Input() index:any
  activeIndex: any;
  @Output() selectedGroup = new EventEmitter<{ }>();
  @Input() type:string = ''
  toggle(group:any) {
    
    if(group !== this.activeIndex){
      this.activeIndex = group
    } else {
      this.activeIndex = null;
    }
    this.isExpanded = !this.isExpanded; // Toggle expand/collapse
    this.backgroundColor = this.isExpanded ? '#232B32' : '#191E22';
    if(this.isExpanded){
      this.selectedGroup.emit({group})
    }
  }
  
}
