import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, inject, input, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { CommonDailogsComponent } from '../../dailogs/common-dailogs/common-dailogs.component';
import { SatelliteService } from '../../services/satellite.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedService } from '../../components/shared/shared.service';
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
  selector: 'app-groups-list',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, DateFormatPipe, MatMenuModule,NgApexchartsModule],
  templateUrl: './groups-list.component.html',
  styleUrl: './groups-list.component.scss'
})
export class GroupsListComponent {
  @Input() group: any; // Current group data
  isExpanded = false; // Tracks expand/collapse state
  @Input() backgroundColor: string = '#191E22';
  @Input() index: any
  activeIndex: any;
  @Output() selectedGroup = new EventEmitter<{}>();
  @Input() type: string = ''
  @Input() padding: string = '';
  private _snackBar = inject(MatSnackBar);
  site_objects_count:any;
  siteDetail:any = {
    acquisition_count: 219,frequency: 2.5,gap: 6.792676837905093,heatmap: [{date: "2025-01-01", count: 2}],
    id: 3,most_recent: "2024-12-05T03:32:13.282960Z",most_recent_clear: "2024-08-30T09:01:44Z",
    name: "W", notification: false, site_type: "Polygon"};
    options: any;
    activeSite:any;
    sitesData:any;
     @ViewChild("chart") chart: ChartComponent;
      public chartOptions: Partial<ChartOptions>;
  constructor(private overlayContainer: OverlayContainer,
    private dialog: MatDialog,
    private satelliteService:SatelliteService,
    private SharedService: SharedService
  ) { 
  }

  
  toggle(group: any) {
    
    if (group !== this.activeIndex) {
      this.activeIndex = group
    
    } else {
      this.activeIndex = null;
    }
    this.isExpanded = !this.isExpanded; // Toggle expand/collapse
    this.backgroundColor = this.isExpanded ? '#232B32' : '#191E22';
    if (this.isExpanded) {
      this.selectedGroup.emit({ group })
    }
  }

  setClass() {
    const containerElement = this.overlayContainer.getContainerElement();
    containerElement.classList.add('group-overlay-container');

  }

  addGroup(type: string, group: any) {
    let data
    if (type == 'addGroup') {
      data = { type: type }
    } else {
      data = { type: type, parent: group.id}
    }

    console.log(group, 'sssssssssssssssssss');

    this.openDialog(data)
  }

  renameGroup(type: any, group: any) {
    const data = { type: type, group: group}
    this.openDialog(data)
  }

  deleteGroup(type: any, group: any) {
    const data = { type: type, group: group}
    this.openDialog(data)
  }

  setNotifications(status:boolean,group:any){
    const payload = {
      group_id: group.id,
      notification: status,
      name:group?.name
    }
    this.satelliteService.updateGroup(payload).subscribe({
      next: (resp) =>{
        this.SharedService.setNestedGroup(true);
      }
    })
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
            this.SharedService.setNestedGroup(true);
            this._snackBar.open('Group updated successfully.', 'Ok', {
              duration: 2000  // Snackbar will disappear after 300 milliseconds
            });
          } else {
            if (data?.type == 'rename') {
              
              const updatedSitesData = this.group?.sites.map((item: any) =>
                item.id === result?.resp?.id ? { ...data?.site, name: result?.resp?.name } : item
              );
              this.group.sites = updatedSitesData
            } else if (data?.type == 'delete') {
              
              const index = this.group?.sites.findIndex((item) => item.id === data?.site?.id);
        
              // Remove the object if found
              if (index !== -1) {
                this.group?.sites.splice(index, 1); // Removes 1 element at the found index
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

  // openDialog(data: any) {
  //   const dialogRef = this.dialog.open(CommonDailogsComponent, {
  //     width: '350px',
  //     height: 'auto',
  //     data: data,
  //     panelClass: 'custom-dialog-class',
  //   });
  //   dialogRef.afterClosed().subscribe((result) => {
  //     console.log(' closed', result);
  //     if(result){
  //       this.SharedService.setNestedGroup(true);
  //     }
      
  //     this._snackBar.open('Group updated successfully.', 'Ok', {
  //       duration: 2000  // Snackbar will disappear after 300 milliseconds
  //     });
     
  //   });
  // }
  // Round off value
  roundOff(value: number): any {
    return Math.round(value);
  }

  //Padding adjustments
  getPadding(value){
    console.log(value,'valuevaluevaluevaluevaluevaluevaluevaluevalue');
    
    const newValue = parseInt(value) -10;
    console.log(newValue.toString(),'valuevaluevaluevaluevaluevaluevaluevaluevalue');
    
    return newValue.toString()
  }

    
  
  
  usedColors = new Set<string>();

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
      
          // Dynamically generate colors using HSL
  generateColor(): string {
    let color: string;

    // Keep generating random colors until a new one is found
    do {
      const hue = Math.floor(Math.random() * 360); // Random hue between 0 and 360
      const saturation = 70; // Vibrant colors (can be adjusted)
      const lightness = 50; // Balanced brightness (can be adjusted)

      color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    } while (this.usedColors.has(color)); // Keep generating until a unique color is found

    // Store the new color to avoid using it again
    this.usedColors.add(color);

    return color;
  }
      
  // getSitesData(queryParams: any) {
  //   this.satelliteService.getSites(queryParams).subscribe({
  //     next: (resp) => {
  //       console.log(resp, 'successsuccesssuccesssuccesssuccess');
  //       this.sitesData = resp.data;
  //       this.siteDetail = resp.data[0];
  //       const colorRanges = this.generateUniqueColorRanges(this.sitesData);
  //       this.options = {
  //         chart: {
  //           height: 105,
  //           width: '255px',
  //           type: 'heatmap',
  //           toolbar: {
  //             show: false,
  //           },
  //         },
  //         plotOptions: {
  //           heatmap: {
  //             shadeIntensity: 0.5,
  //             radius: 0,
  //             useFillColorAsStroke: true,
  //             columnWidth: '8px',
  //             rowHeight: '8px',
  //             colorScale: {
  //               ranges: colorRanges.map(range => ({
  //                 from: range.from,
  //                 to: range.to,
  //                 name: '',
  //                 color: range.color,
  //               }))
  //             }
  //           },
  //         },
  //         dataLabels: {
  //           enabled: false,
  //         },
  //         stroke: {
  //           show: true,               // Enable borders
  //           width: 1,                 // Set the width of the border
  //           colors: '#FFFFFF'         // Set the border color, you can change this to any color
  //         },
  //         legend: {
  //           show: false,
  //         },
  //         xaxis: {
  //           labels: {
  //             show: false, // Hides the x-axis labels
  //           },
  //           axisBorder: {
  //             show: false, // Hides the x-axis line
  //           },
  //           axisTicks: {
  //             show: false, // Hides the x-axis ticks
  //           },
  //         },
  //         yaxis: {
  //           labels: {
  //             show: false
  //           }
  //         }
  //       };
  //       setTimeout(() => {
  //         this.initializeCharts();
  //       }, 300)
  //     },
  //     error: (err: any) => {
        
  //       console.error('API call failed', err);
  //     }
  //   })
  // }
      
  getSitesData(queryParams: any) {
    this.satelliteService.getSites(queryParams).subscribe({
      next: (resp) => {
        console.log(resp, 'successsuccesssuccesssuccesssuccess');
        this.sitesData = resp.data;
        this.siteDetail = resp.data[0];
  
        // Generate unique color ranges based on heatmap values
  
        // Define heatmap options with color ranges
      
  
        setTimeout(() => {
          this.initializeCharts();
        }, 300);
      },
      error: (err: any) => {
        console.error('API call failed', err);
      }
    });
  }
          
  generateUniqueColorRanges(data: any[]): { from: number; to: number; color: string; label: string }[] {
    let min = Number.MAX_VALUE, max = Number.MIN_VALUE;
  
    // Find min and max values in dataset
    data.forEach(site => {
      site.heatmap.forEach((point: { count: number }) => {
        if (point.count < min) min = point.count;
        if (point.count > max) max = point.count;
      });
    });
  
    // Define color gradient ranges
    const colorRanges = [
      { from: min, to: min + (max - min) * 0.2, color: '#fef0d9', label: 'Very Low' }, // Lightest
      { from: min + (max - min) * 0.2, to: min + (max - min) * 0.4, color: '#fdcc8a', label: 'Low' },
      { from: min + (max - min) * 0.4, to: min + (max - min) * 0.6, color: '#fc8d59', label: 'Moderate' },
      { from: min + (max - min) * 0.6, to: min + (max - min) * 0.8, color: '#e34a33', label: 'High' },
      { from: min + (max - min) * 0.8, to: max, color: '#b30000', label: 'Very High' } // Darkest
    ];
  
    return colorRanges;
  }

  //Intialize chart
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

      const updatedSitesData = this.group?.sites.map((item: any) =>
        item.id === site.id ? { ...site, notification: type } : item
      );
      this.group.sites = updatedSitesData
    
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
