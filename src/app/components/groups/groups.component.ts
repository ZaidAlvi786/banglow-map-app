import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, inject, OnInit, Output, ViewChild } from '@angular/core';
import { GroupsListComponent } from '../../common/groups-list/groups-list.component';
import { SatelliteService } from '../../services/satellite.service';
import { MatInputModule } from '@angular/material/input';
import { catchError, debounceTime, of, Subject, switchMap } from 'rxjs';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CommonDailogsComponent } from '../../dailogs/common-dailogs/common-dailogs.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedService } from '../shared/shared.service';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import ApexCharts from 'apexcharts';
import {
  ApexAxisChartSeries,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexChart,
  ApexPlotOptions
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  title: ApexTitleSubtitle;
  xaxis: ApexXAxis; // ✅ Add xaxis type
  yaxis: ApexYAxis; // ✅ Add yaxis type
  grid: ApexGrid; // ✅ Add grid type
  legend: ApexLegend;
};  

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule,GroupsListComponent,MatInputModule,DateFormatPipe,MatMenuModule,NgApexchartsModule,],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.scss'
})
export class GroupsComponent implements OnInit,AfterViewInit {
  groups = [];
  activeGroup:any;
  @Output() closeDrawer = new EventEmitter<boolean>();
  searchInput = new Subject<string>();
  activeIndex:number  = null;
  nestedGroupsData:any = [];
  parentGroupID:any = null
  private _snackBar = inject(MatSnackBar);
  activeSite:any;
  siteDetail:any= null
  options: any;
  sitesData:any;
  @ViewChild("chart") chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
    
  constructor(
    private satelliteService:SatelliteService,
    private overlayContainer: OverlayContainer,
    private dialog: MatDialog,
    private sharedService: SharedService
  ){
    if(this.searchInput){
     this.searchInput.pipe(
          debounceTime(500),  // Wait for 1000ms after the last key press
          switchMap((inputValue) => {
            const data = {
              group_name:inputValue
            }
            
            return this.satelliteService.getParentGroups(data).pipe(
              catchError((err) => {
                
                console.error('API error:', err);
                // Return an empty array to allow subsequent API calls to be made
                return of({ data: [] });
              })
            );
          })
        ).subscribe({
          next: (resp: any) => {
            
            console.log(resp, 'API Response');
            this.groups = resp;
          },
          error: (err: any) => {
            console.error('API call failed', err);
          }
        });
      }
  }

  ngOnInit(): void {
    this.getGroups()
  }

  ngAfterViewInit(): void {
    this.sharedService.getNestedGroup$.subscribe((group:any) => {
      if(group){
        this.sharedService.updatedNestedGroup$.subscribe((state) => {
          console.log(state,'statestatestatestatestatestate');
          const data = {group_id:state}
          this.satelliteService.getNestedGroup(data).subscribe({
          next: (resp) => {
            console.log(resp,'getNestedGroupgetNestedGroupgetNestedGroupgetNestedGroup');
    
            this.nestedGroupsData = resp
    
          }})
        })
      }
    })
   
  }

  getGroups() {
    this.selectedGroupEvent(null)
   const params ={
      group_name:''

    }
  
      this.satelliteService.getParentGroups(params).subscribe({
        next: (resp) => {
          console.log(resp, 'respresprespresprespresprespresprespresp');
          this.groups = resp
  
        }
      })
    
  
  }
  selectedGroupEvent(event: any) {
    console.log(event, 'selectedeventeventeventevent');
    if (event) {
      this.activeGroup = event
    }
  }

  closeLibraryDrawer() {
    this.closeDrawer.emit(true);
  
  }

   //On Keypress filter groups data
   onKeyPress(event: KeyboardEvent): void {
    const inputValue = (event.target as HTMLInputElement).value;
    console.log(inputValue, 'inputValueinputValueinputValue'); // Log the current input value to the console

    // this.satelliteService.getGroupsForAssignment(data).subscribe({
    //   next: (resp) => {
    //     console.log(resp,'respresprespresprespresprespresprespresp');

    //     this.groups = resp?.data

    //   }})
    console.log(this.searchInput, 'searchiiiiiiiiiiiiiiiii');

    this.searchInput.next(inputValue);
  }

  rowExpanded(i,group){
    if(this.activeIndex !== i){
      this.activeIndex = i
      const data = {group_id:group.id}
      this.parentGroupID = group.id
      this.sharedService.setUpdatedNestedGroup(this.parentGroupID)
      this.satelliteService.getNestedGroup(data).subscribe({
      next: (resp) => {
        console.log(resp,'getNestedGroupgetNestedGroupgetNestedGroupgetNestedGroup');

        this.nestedGroupsData = resp

      }})

    } else {
      this.activeIndex = null
    }
   
  }

  setClass(){
    const containerElement = this.overlayContainer.getContainerElement();
    containerElement.classList.add('custom-cdk-overlay-container');  
  }

  //Add group functionality

  addGroup(type: string,group: any) {
    let data 
    if(type == 'addGroup'){
      data = {type: type}
    } else {
      data = {type: type, parent: group.id}
    }
   
   console.log(group,'sssssssssssssssssss');
   
   this.openDialog(data)
  }

  renameGroup(type:any,group:any){
    const data = {type:type, group:group}
    this.openDialog(data)
  }

  deleteGroup(type:any,group:any){
    const data = {type:type, group:group}
    this.openDialog(data)
  }

  openDialog(data:any){
    const dialogRef = this.dialog.open(CommonDailogsComponent, {
        width: '350px',
        height: 'auto',
        data: data,
        panelClass: 'custom-dialog-class',
      });
      dialogRef.afterClosed().subscribe((result) => {
        console.log('Dialog closed', result);
        if(result){
          if(data?.group){
            this.getGroups();
            this._snackBar.open('Group updated successfully.', 'Ok', {
              duration: 2000  // Snackbar will disappear after 300 milliseconds
            });
          } else {
            if (data?.type == 'rename') {
              
              const updatedSitesData = this.nestedGroupsData.sites.map((item: any) =>
                item.id === result?.resp?.id ? { ...data?.site, name: result?.resp?.name } : item
              );
              this.nestedGroupsData.sites = updatedSitesData
            } else if (data?.type == 'delete') {
              
              const index = this.nestedGroupsData.sites.findIndex((item) => item.id === data?.site?.id);
        
              // Remove the object if found
              if (index !== -1) {
                this.nestedGroupsData.sites.splice(index, 1); // Removes 1 element at the found index
              }
              this._snackBar.open('Site updated successfully.', 'Ok', {
                duration: 2000  // Snackbar will disappear after 300 milliseconds
              });
            }
          }
          
          
        }
        // this.getUpdateGroup(result)
       

       
      });
  }

  setNotifications(status:boolean,group:any){
    const payload = {
      group_id: group.id,
      name: group?.name,
      notification: status,
    }
    this.satelliteService.updateGroup(payload).subscribe({
      next: (resp) =>{
        // this.getUpdateGroup(resp)
        this.getGroups()
      }
    })
  }

  getUpdateGroup(data) {
    const index = this.groups.findIndex(x => x.id == data.id);
    if (index>-1) {
      this.groups[index] = data;
    }
  }

  UpdateGroupEvent(event:any){
    console.log(event,'grouppppppppppppppppppppppppppppppppppppp');
    
  }

  // Round off value
  roundOff(value: number): any {
    return Math.round(value);
  }

  //Get site details
  getSitesDetail(site){
    console.log(site,'sitesitesitesitesitesitesitesitesite');
    
    if(this.activeSite !== site.id){
      let queryParams = {
       
        site_id: site.id,
      }
      this.getSitesData(queryParams)
      this.activeSite = site.id;
     
    } else {
      this.activeSite = null
    }
  }
  //Intialize chart
  //  initializeCharts() {
     
  //       const chartElement = document.querySelector(`#chart`);
  //       if (chartElement && !chartElement.hasChildNodes()) {
  //         const heatmapData = this.siteDetail.heatmap.map((item: { date: string; count: number }) => ({
  //           x: item.date,
  //           y: item.count,
  //         }));
  
  //         const chartOptions = {
  //           ...this.options,
  //           series: [
  //             {
  //               name: `Site`,
  //               data: heatmapData,
  //             },
  //           ],
  //         };
  
  //         const chart = new ApexCharts(chartElement, chartOptions);
  //         chart.render()
  //           .then(() => console.log(''))
  //           .catch((err: any) => console.error(`Error rendering chart`, err));
  //       }
      
  //   }

    // generateUniqueColorRanges(data: any): any[] {
    //   const ranges = [];
  
    //   data.forEach((value, index) => {
    //     value.heatmap.forEach((item) => {
    //       ranges.push({
    //         from: item.count,
    //         to: item.count,
    //         color: this.generateColor()
    //       });
    //     });
    //   });
  
    //   return ranges;
    // }
    // Dynamically generate colors using HS

    getSitesData(queryParams: any) {
      this.satelliteService.getSites(queryParams).subscribe({
        next: (resp) => {
          console.log(resp, 'successsuccesssuccesssuccesssuccess');
          this.sitesData = resp.data;
          this.siteDetail = resp.data[0];
    
          // Generate unique color ranges based on heatmap values
         
    
          setTimeout(() => {
            this.initializeCharts();
          }, 300);
        },
        error: (err: any) => {
          console.error('API call failed', err);
        }
      });
    }
    
     // Initialize the ApexCharts heatmap after receiving site data.
     initializeCharts() {
      if (!this.siteDetail || !this.siteDetail.heatmap) {
        return;
      }
      
      let maxValue = Math.max(...this.siteDetail.heatmap.map(entry => entry.count));
      if (maxValue < 100) {
        maxValue = 100; // Default max value to 100 if less than 100
      }
      const rangeStep = Math.ceil(maxValue / 6);
    
     
    
      const groupedData = this.groupHeatmapDataIntoRows(this.siteDetail.heatmap, 3);
    
      this.chartOptions = {
        series: groupedData.map((group, index) => ({
          name: `Site`,
          data: group.map((entry) => ({
            x: entry.date || " ", // Ensure x is a valid string
            y: entry.count !== null ? entry.count : null // Ensure y is valid
          }))
        })),
        chart: {
          height: 110,
          width: 320,
          type: "heatmap",
          toolbar: {
            show: false // Hides the toolbar
          }
        },
        plotOptions: {
          heatmap: {
            shadeIntensity: 0.5,
            colorScale: {
              ranges: [
                { from: 0, to: rangeStep, name: "Very Low", color: "#272F34" },
                { from: rangeStep + 1, to: rangeStep * 2, name: "Low", color: "#2A2130" },
                { from: rangeStep * 2 + 1, to: rangeStep * 3, name: "Medium", color: "#122B64" },
                { from: rangeStep * 3 + 1, to: rangeStep * 4, name: "High", color: "#386118" },
                { from: rangeStep * 4 + 1, to: rangeStep * 5, name: "Very High", color: "#FFC300" },
                { from: rangeStep * 5 + 1, to: maxValue, name: "Extreme", color: "#C70039" }
              ]
            }
          }
        },
        dataLabels: {
          enabled: false // Hides data labels inside heatmap cells
        },
        title: {
          text: "", // Hides the title
          align: "left",
          style: {
            fontSize: "0px" // Ensures title is visually hidden
          }
        },
        xaxis: {
          labels: { show: false },
          axisTicks: { show: false },
          axisBorder: { show: false }
        },
        yaxis: {
          labels: { show: false },
          axisTicks: { show: false },
          axisBorder: { show: false }
        },
        grid: {
          show: true,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: false } }
        },
        legend: { show: false }
      };
    
      console.log("Processed Chart Series:", this.chartOptions.series);
    }
    
    groupHeatmapDataIntoRows(heatmapData: any[], rows = 3) {
      const groupedData = [];
      const itemsPerRow = Math.ceil(heatmapData.length / rows);
    
      // Group the data into rows
      for (let i = 0; i < rows; i++) {
        const start = i * itemsPerRow;
        const end = start + itemsPerRow;
        groupedData.push(heatmapData.slice(start, end));
      }
    
      // Pad rows with empty values (use valid placeholders)
      const maxLength = Math.max(...groupedData.map(group => group.length));
      groupedData.forEach(group => {
        while (group.length < maxLength) {
          group.unshift({ date: " ", count: null }); // Use an empty string for x and null for y
        }
      });
    
      return groupedData;
    }
    
    
    
    
    renameSite(type:any,group:any){
      const data = {type:type, site:group}
      this.openDialog(data)
    }
  
    deleteSite(type:any,group:any){
      const data = {type:type, site:group}
      this.openDialog(data)
    }
    updateSite(type: any, site: any) {
      let payload: any
        payload = {
          site_id: site.id,
          name: site.name,
          notification: type,
          is_deleted: false,
        }
  
        const updatedSitesData = this.nestedGroupsData?.sites.map((item: any) =>
          item.id === site.id ? { ...site, notification: type } : item
        );
        this.nestedGroupsData.sites = updatedSitesData
      
      this.satelliteService.updateSite(payload).subscribe({
        next: (resp) => {
          if (resp) {
            this._snackBar.open('Site updated successfully.', 'Ok', {
              duration: 2000  // Snackbar will disappear after 300 milliseconds
            });
          }
  
  
        }
      })
    }

    getSiteType(type: string): string {
      if (type === 'Rectangle') {
        return 'assets/svg-icons/rectangle-icon.svg'
      } else   if (type === 'Polygon') {
        return 'assets/svg-icons/polygon-icon.svg'
      }  if (type === 'Point') {
        return 'assets/svg-icons/pin-location-icon.svg'
      }

      return '';
    }
}
