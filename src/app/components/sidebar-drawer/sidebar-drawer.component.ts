import { Component, Input } from '@angular/core';
import { LibraryComponent } from "../library/library.component";

@Component({
  selector: 'app-sidebar-drawer',
  standalone: true,
  imports: [LibraryComponent],
  templateUrl: './sidebar-drawer.component.html',
  styleUrl: './sidebar-drawer.component.scss'
})
export class SidebarDrawerComponent {
@Input()type: string=''
}
