import { Component, OnInit, OnDestroy } from '@angular/core';
import { merge, Subscription } from 'rxjs';
import { SocketService } from '../../services/socket.service';
import { CommonModule } from '@angular/common';
import { UtcMonthDatePipe } from '../../pipes/date-format.pipe';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule,UtcMonthDatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notificationsList: any[] = [];
  unreadCount: number = 0;
   filteredData:any[]=this.notificationsList
  activeTab:string = 'all'
  private socketSubscription!: Subscription;

  constructor(private socketService: SocketService) {}

  ngOnInit() {
    // ✅ Listen to both real & fake notifications using `merge()`
    this.socketSubscription = merge(
      // this.socketService.listenForNotifications(), // Real WebSocket data
      // this.socketService.fakeNotifications$ // Fake notifications every 5 sec
    ).subscribe((newNotification) => {
      console.log("📩 Received Notification:", newNotification);
      this.notificationsList.unshift(newNotification);
      this.updateUnreadCount();
    });

    this.updateUnreadCount();
  }

  ngOnDestroy() {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }

  private updateUnreadCount() {
    this.unreadCount = this.notificationsList.filter((notification) => !notification.read).length;
  }

  sendTestNotification() {
    // this.socketService.sendTestNotification();
  }

  markAllRead() {
    this.notificationsList.forEach(notification => {
      notification.read = true;
    });
    this.updateUnreadCount()
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
    this.updateUnreadCount()
  }

  readNotification(data: any) {
    this.filteredData = this.notificationsList.map(notification =>
      notification.id === data.id ? { ...notification, read: true } : notification
    );
    this.updateUnreadCount()
  }
}
