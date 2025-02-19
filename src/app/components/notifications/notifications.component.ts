import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UtcMonthDatePipe } from '../../pipes/date-format.pipe';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule,UtcMonthDatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent {
  notificationsList:any[]=[{
    title:'New site added to Manual JW PLA Navy Marine group',read:false,id:1,createdAt:'2025-02-12T08:59:34.735807Z',name:'New site'
  },
  {
    title:'New group added ',read:false,id:2,createdAt:'2025-02-12T08:59:34.735807Z',name:'My group'
  },
  {
    title:'Site Untitled site deleted of Manual JW PLA Navy Marine group',read:false,id:3,createdAt:'2025-02-12T08:59:34.735807Z',name:'Untitled site'
  },
  {
    title:'New site Shuidao Base added to Manual JW PLA Navy Marine group',read:false,id:4,createdAt:'2025-02-12T08:59:34.735807Z',name:'Shuidao Base'
  },
  {
    title:'New site Sanya Comprehensive Support Base added to Manual JW PLA Navy Marine group',read:true,id:5,createdAt:'2025-02-12T08:59:34.735807Z',name:'Sanya Comprehensive Support Base'
  },
  {
    title:'New site Subi Reef Base added to Manual JW PLA Navy Marine group',read:true,id:6,createdAt:'2025-02-12T08:59:34.735807Z',name:'Subi Reef Base'
  },]
  filteredData:any[]=this.notificationsList
  activeTab:string = 'all'

  markAllRead() {
    this.notificationsList.forEach(notification => {
      notification.read = true;
    });
  }
  setActiveTab(type:string) {
    if(type ==='unread'){
      this.activeTab = type
      const unreadNotifications = this.notificationsList.filter(notification => !notification.read);
      this.filteredData = unreadNotifications
    } else {
      this.activeTab = type
      this.filteredData = this.notificationsList
    }
  }

  readNotification(data: any) {
    this.filteredData = this.notificationsList.map(notification =>
      notification.id === data.id ? { ...notification, read: true } : notification
    );
  }
  
}
