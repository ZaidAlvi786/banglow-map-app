import { AfterViewInit, ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { LoadingService } from './services/loading.service';
import { SharedService } from './components/shared/shared.service';
import { SocketService } from './services/socket.service';
import { Subscription } from 'rxjs';
import { UtcDateTimePipe } from './pipes/date-format.pipe';
import { CommonModule } from '@angular/common';
import { SatelliteService } from './services/satellite.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgxUiLoaderModule,UtcDateTimePipe, RouterModule],
  providers: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnChanges, AfterViewInit {
  title = 'bungalow-app';
  isLoading = false;
  siteNotification:boolean = false;
  showRefreshInfo:boolean = false
  private socketSubscription!: Subscription;
  message: any;
  siteUpdateInfo:any

  findIp: boolean = false;

  constructor(private LoadingService:LoadingService,private sharedService:SharedService,
    private socketService: SocketService, private satelliteService: SatelliteService){

  }
  ngOnInit(): void {
    this.socketService.getMessages().subscribe((msg)=>{
      if(msg.type === "new_records" && msg.new_updates>0){
        this.showRefreshInfo = true;
        this.message = msg
        setTimeout(()=>{
          this.showRefreshInfo = false;
          this.message = null
        },60000)
      } else if(msg.type === "site_update" && msg.new_updates>0) {
        this.siteNotification = true;
        this.siteUpdateInfo = msg
        setTimeout(()=>{
          this.siteNotification = false;
          this.siteUpdateInfo = null
        },60000)
      }
    })


    this.satelliteService.validateIpAddress().subscribe( {
      next: (data) =>  this.findIp = true,
      error: (err) => {
        alert(err?.error?.error)
        this.findIp = false
      }
    });

  }

  ngAfterViewInit(): void {
    setTimeout(()=> {
      this.LoadingService.currentValue.subscribe((value) => {
        this.isLoading = value;
      });
    })
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    this.LoadingService.currentValue.subscribe((value) => {
      this.isLoading = value;
    });

  }
  closeSiteInfo(){
    this.siteNotification = false
    this.siteUpdateInfo = null
  }
  refreshList(){
    this.sharedService.refreshList.set(true);
    this.showRefreshInfo = false
    this.message = null
  }
  closeRefreshInfo(){
    this.showRefreshInfo = false;
    this.message = null
  }

  ngOnDestroy() {
    this.socketService.disconnect(); // Close the WebSocket connection
  }
}
