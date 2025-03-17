import { AfterViewInit, ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { LoadingService } from './services/loading.service';
import { SharedService } from './components/shared/shared.service';
import { SocketService } from './services/socket.service';
import { Subscription } from 'rxjs';
import { UtcDateTimePipe } from './pipes/date-format.pipe';

// import { AppRoutingModule } from './app.routes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HomeComponent,NgxUiLoaderModule,UtcDateTimePipe],
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
  constructor(private LoadingService:LoadingService,private sharedService:SharedService,private cdr:ChangeDetectorRef,private socketService: SocketService){

  }
  ngOnInit(): void {
    this.socketService.getMessages().subscribe((msg)=>{
      console.log("jkdsnkjsdvds", msg)
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



    console.log("this.socketServicethis.socketService", this.socketService);
        // this.siteNotification = false
    // this.showRefreshInfo = true
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
