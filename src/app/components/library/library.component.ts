import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TemplateRef } from '@angular/core';
import { ViewChild } from '@angular/core';

export class Group {
  name?: string;
  icon?: string; // icon name for Angular Material icons
  children?: Group[]; // nested groups
}
@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, MatMenuModule,MatFormFieldModule,ReactiveFormsModule,FormsModule,MatButtonModule,MatInputModule,MatCheckboxModule,MatListModule,MatIconModule],
  templateUrl: './library.component.html',
  styleUrl: './library.component.scss'
})
export class LibraryComponent {

  @ViewChild('myTemplate', { static: true }) myTemplate!: TemplateRef<any>;
  renderGroup!: TemplateRef<any> | null;
  checked:boolean = false;
  groups: Group[] = [
    { name: 'Group name', icon: 'folder', children: [] },
    { 
      name: 'Group name', 
      icon: 'folder', 
      children: [
        { name: 'Subgroup name', icon: 'folder_open', children: [] },
        { name: 'Another subgroup', icon: 'folder', children: [] },
      ]
    },
    // Add more groups as needed
  ];

  ngOnInit() {
    // Assign the template to renderGroup
    this.renderGroup = this.myTemplate;
  }
}
