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
  colorRanges: any[] = [];

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
    const classesToRemove = ['site-menu', 'filter-overlay-container','library-overlay-container','imagery-filter-container','column-menu'];
    const containerElement = this.overlayContainer.getContainerElement();
    containerElement.classList.remove(...classesToRemove);
    containerElement.classList.add('custom-menu-container');  
  }

  setMainClass(){
    const classesToRemove = ['custom-menu-container','filter-overlay-container','library-overlay-container','imagery-filter-container','column-menu'];
    const containerElement = this.overlayContainer.getContainerElement();
    containerElement.classList.remove(...classesToRemove);
    containerElement.classList.add('site-menu');
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

  renameGroup(type:any,group:any,value:any){
    const data = {type:type, group:group,value:value}
    this.openDialog(data)
  }

  deleteGroup(type:any,group:any,value){
    const data = {type:type, group:group,value:value}
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
          if(data?.type=='addGroup'){
            this.getGroups();
            this._snackBar.open('Group updated successfully.', 'Ok', {
              duration: 2000  // Snackbar will disappear after 300 milliseconds
            });
          } else if(data.type === 'addSubgroup') {
            console.log(data,'addSubgroupaddSubgroupaddSubgroupaddSubgroup');
            
            const payload = {group_id:data?.group?.id || data.parent}
            this.satelliteService.getNestedGroup(payload).subscribe({
              next: (resp) => {
                console.log(resp,'getNestedGroupgetNestedGroupgetNestedGroupgetNestedGroup');
        
                this.nestedGroupsData = resp
        
              }})
          } else if(data.value ==='renameGroup' || data.value ==='deleteGroup') {
            this.getGroups()
            
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
         
    
         
            this.initializeCharts();
        
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
    
      const heatmapData = this.siteDetail.heatmap.map(entry => entry.count);
      const maxValue = Math.max(...heatmapData); // No hardcoded 100
      const minValue = Math.min(...heatmapData);
      const rangeCount = Math.max(5, Math.floor((maxValue - minValue) / 5));
      const rangeStep = Math.ceil((maxValue - minValue) / rangeCount); // 5 dynamic ranges

  const colorStatus = ['']
// ✅ Generate dynamic color ranges
const colorRanges = Array.from({ length: 5 }, (_, i) => {
  const from = minValue + i * rangeStep;
  const to = i === 4 ? maxValue : from + rangeStep - 1; // Ensure the last range covers maxValue
  return {
    from,
    to,
    color: this.getColor(from, heatmapData), // Dynamic color using getColor
    name: `${from} - ${to}`
  };
});


this.colorRanges = colorRanges;
    
      const groupedData = this.groupHeatmapDataIntoRows(this.siteDetail.heatmap, 3);
      console.log("groupedDatagroupedDatagroupedData", groupedData);
      
    
      this.chartOptions = {
        series: groupedData.map((group, index) => ({
          name: 'Site',
          data: group.map((entry) => ({
            x: entry.date ?? "no data", // Use "Empty" for padding values
            y: entry.count ?? 0 // Use `null` for padding counts
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
            enableShades: false,
            colorScale: {
              // ranges: [
              //   { from: 0, to: 0, name: "Zero", color: "#272F34" }, // Neutral gray for zero
              //   { from: 1, to: rangeStep, name: "Very Low", color: "#2ECC71" }, // Light Green
              //   { from: rangeStep + 1, to: rangeStep * 2, name: "Low", color: "#218838" }, // Darker Green
              //   { from: rangeStep * 2 + 1, to: rangeStep * 3, name: "Medium", color: "#B22222" }, // Dark Red
              //   { from: rangeStep * 3 + 1, to: rangeStep * 4, name: "High", color: "#D32F2F" }, // Stronger Red
              //   { from: rangeStep * 4 + 1, to: rangeStep * 5, name: "Very High", color: "#C70039" }, // Deep Red
              //   { from: rangeStep * 5 + 1, to: maxValue, name: "Extreme", color: "#8B0000" } // Darkest Red
              // ]
              ranges: colorRanges,
              min: minValue,
              max: maxValue
              
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
          labels: {
            show: false // Hides X-axis labels completely
          },
          axisTicks: {
            show: false // Hides X-axis ticks
          },
          axisBorder: {
            show: false // Hides X-axis border
          }
        },
        yaxis: {
          labels: {
            show: false // Hides Y-axis labels completely
          },
          axisTicks: {
            show: false // Hides Y-axis ticks
          },
          axisBorder: {
            show: false // Hides Y-axis border
          }
        },
        grid: {
          show: true, // Controls gridlines visibility
          xaxis: {
            lines: {
              show: false // Hides vertical gridlines
            }
          },
          yaxis: {
            lines: {
              show: false // Hides horizontal gridlines
            }
          }
          
        },
        legend: {
          show: false // ✅ Hides the legend
        }
      };
    }
    
    groupHeatmapDataIntoRows(heatmapData: any[], rows = 3) {
      // Remove the last value to ensure the length is exactly 30
      if (heatmapData.length > 30) {
        heatmapData.splice(-1, 1);
      }
    
      const groupedData = [];
      const itemsPerRow = 10; // Each row must have 10 items
    
      // Group the data into rows
      for (let i = 0; i < rows; i++) {
        const start = i * itemsPerRow;
        const end = start + itemsPerRow;
        groupedData.push(heatmapData.slice(start, end));
      }
    
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
    getColor(value, data) {
      const min = Math.min(...data);
      const max = Math.max(...data);
      const mean = data.reduce((sum, v) => sum + v, 0) / data.length;
    
        if (min ==0 && max == 0) return 'gray'
      // Special case: Only one value
      if (min === max) return `rgb(255, 0, 0)`; // Default red for single value
    
      // Clamp value between min and max
      const clampedValue = Math.min(Math.max(value, min), max);
    
      // Normalize value between 0 and 1
      const normalized = (clampedValue - min) / (max - min);
    
       if (normalized ==0) return 'gray'
      // Calculate red (increases with value) and green (decreases with value)
      const red = Math.round(255 * normalized);
      const green = Math.round(255 * (1 - normalized));
    
      return `rgb(${red}, ${green}, 0)`; // Gradient from green to red
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
