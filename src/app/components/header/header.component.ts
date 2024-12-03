import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Input() toggleDrawer?: () => void;
  @Output() toggleEvent = new EventEmitter<string>();
  onToggleDrawer(type:string) {
    if (this.toggleDrawer) {
      this.toggleDrawer();
      this.toggleEvent.emit(type);
    }
  }
}
