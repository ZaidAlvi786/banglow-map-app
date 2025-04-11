import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, effect, EventEmitter, inject, input, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { DateFormatPipe, UtcDateTimePipe } from '../../pipes/date-format.pipe';
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
import dayjs from 'dayjs';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';

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
type CalendarDay = {
  date: string;
  value: number | null;
  colorValue: string;
  backgroundValue: string;
  rangeName:string;
};
type CalendarWeek = CalendarDay[];
type CalendarMonth = { name: string; weeks: CalendarWeek[] };
@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, DateFormatPipe, MatMenuModule,NgApexchartsModule,MatCheckboxModule, UtcDateTimePipe],
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
    hoveredRange: string | null = null;
     @ViewChild("chart") chart: ChartComponent;
      public chartOptions: Partial<ChartOptions>;
      tooltipPosition: any = {};
      weekDays: string[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      calendarData: CalendarMonth[] = [];
      colorRanges = [
        
    ]
    selectedSites: any[] = [];
  constructor(private overlayContainer: OverlayContainer,
    private dialog: MatDialog,
    private satelliteService:SatelliteService,
    private SharedService: SharedService
  ) { 
    effect(() => {
      this.selectedSites = this.SharedService.mapActiveSites()();  // Automatically updates when the signal changes
      console.log(this.selectedSites, 'selectedSites');
    });
  }

  
  toggle(group: any) {
    
    if (group !== this.activeIndex) {
      this.activeIndex = group
      this.selectedGroup.emit({ group });
      this.SharedService.setGroupData(group)
    
    } else {
      this.activeIndex = null;
      this.selectedGroup.emit( null )
      this.SharedService.setGroupData(null)
    }
    this.isExpanded = !this.isExpanded; // Toggle expand/collapse
    this.backgroundColor = this.isExpanded ? '#232B32' : '#191E22';
    
    if (this.isExpanded) {
      
      
    } 
  }

  setClass() {
    const classesToRemove = ['site-menu', 'filter-overlay-container','library-overlay-container','custom-menu-container','imagery-filter-container','log-view-menu'];
    const containerElement = this.overlayContainer.getContainerElement();
    containerElement.classList.remove(...classesToRemove);
    containerElement.classList.add('group-overlay-container');

  }

  setMainClass(){
    const classesToRemove = ['group-overlay-container', 'filter-overlay-container','library-overlay-container','custom-menu-container','imagery-filter-container','log-view-menu'];
    const containerElement = this.overlayContainer.getContainerElement();
    containerElement.classList.remove(...classesToRemove);
    containerElement.classList.add('site-menu');
  }

  addGroup(type: string, group: any) {
    let data
    if (type == 'addGroup') {
      data = { type: type }
    } else {
      data = { type: type, parent: group.id}
    }


    this.openDialog(data)
  }

  renameGroup(type: any, group: any,value:any) {
    const data = { type: type, group: group,value:value}
    this.openDialog(data)
  }

  deleteGroup(type: any, group: any,value: any) {
    const data = { type: type, group: group,value:value}
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
        this.group.notification = status
        this.SharedService.setNestedGroup(true);
        this._snackBar.open(`Notification status apdated to ${status ? 'on':'off'}`, 'Ok', {
          duration: 2000  // Snackbar will disappear after 300 milliseconds
        });
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
        if(result){
          if(data.type === 'addSubgroup'){
            this.SharedService.setNestedGroup(true);
            this._snackBar.open('Group updated successfully.', 'Ok', {
              duration: 2000  // Snackbar will disappear after 300 milliseconds
            });
          } else if(data.value ==='renameGroup' || data.value ==='deleteGroup') {
            this.SharedService.setNestedGroup(true);
            
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
    
    const newValue = parseInt(value) -10;
    
    return newValue.toString()
  }

    
  
  
  usedColors = new Set<string>();

  //Get site details
    getSitesDetail(site){
      
      if(this.activeSite !== site.id){
        let queryParams = {
          
          site_id: site.id,
        }
        this.updateSitesCount(site.id)
        this.getSitesData(queryParams)
        this.activeSite = site.id;
        
      } else {
        this.activeSite = null
      }
    }
    markerData(siteDetail: any) {
      const alreadyExists = this.selectedSites.some(site => site.id === siteDetail.id);
      
      if (!alreadyExists) {
        this.selectedSites.push(siteDetail);
      }
    
      const dataArray = this.selectedSites.map(site => {
        const [lon, lat] = site?.coordinates?.coordinates[0][0];
        return {
          lat,
          lon,
          id: site.id,
          name: site.name

        };
      });
    
      this.SharedService.setSiteMarkerData(dataArray);
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
        this.sitesData = resp.data;
        this.siteDetail = resp.data[0];
        this.generateCalendarData(resp.data[0].heatmap)
        // Generate unique color ranges based on heatmap values
  
        // Define heatmap options with color ranges
      
  
        setTimeout(() => {
          // this.initializeCharts();
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
  // initializeCharts() {
  //   if (!this.siteDetail || !this.siteDetail.heatmap) {
  //     return;
  //   }
  
  //   let maxValue = Math.max(...this.siteDetail.heatmap.map(entry => entry.count));
  //   if (maxValue < 100) {
  //     maxValue = 100; // Default max value to 100 if less than 100
  //   }
  //   const rangeStep = Math.ceil(maxValue / 6);
  
  //   const groupedData = this.groupHeatmapDataIntoRows(this.siteDetail.heatmap, 3);
  
  //   this.chartOptions = {
  //     series: groupedData.map((group, index) => ({
  //       name: `Week ${index + 1}`,
  //       data: group.map((entry) => ({
  //         x: entry.date,
  //         y: entry.count
  //       }))
  //     })),
  //     chart: {
  //       height: 110,
  //       width: 320,
  //       type: "heatmap",
  //       toolbar: {
  //         show: false // Hides the toolbar
  //       }
  //     },
  //     plotOptions: {
  //       heatmap: {
  //         shadeIntensity: 0.5,
  //         colorScale: {
  //           ranges: [
  //             { from: 0, to: 0, name: "Zero", color: "#272F34" }, // Neutral gray for zero
  //             { from: 1, to: rangeStep, name: "Very Low", color: "#2ECC71" }, // Light Green
  //             { from: rangeStep + 1, to: rangeStep * 2, name: "Low", color: "#218838" }, // Darker Green
  //             { from: rangeStep * 2 + 1, to: rangeStep * 3, name: "Medium", color: "#B22222" }, // Dark Red
  //             { from: rangeStep * 3 + 1, to: rangeStep * 4, name: "High", color: "#D32F2F" }, // Stronger Red
  //             { from: rangeStep * 4 + 1, to: rangeStep * 5, name: "Very High", color: "#C70039" }, // Deep Red
  //             { from: rangeStep * 5 + 1, to: maxValue, name: "Extreme", color: "#8B0000" } // Darkest Red
  //           ]
  //         }
  //       }
  //     },
  //     dataLabels: {
  //       enabled: false // Hides data labels inside heatmap cells
  //     },
  //     title: {
  //       text: "", // Hides the title
  //       align: "left",
  //       style: {
  //         fontSize: "0px" // Ensures title is visually hidden
  //       }
  //     },
  //     xaxis: {
  //       labels: {
  //         show: false // Hides X-axis labels completely
  //       },
  //       axisTicks: {
  //         show: false // Hides X-axis ticks
  //       },
  //       axisBorder: {
  //         show: false // Hides X-axis border
  //       }
  //     },
  //     yaxis: {
  //       labels: {
  //         show: false // Hides Y-axis labels completely
  //       },
  //       axisTicks: {
  //         show: false // Hides Y-axis ticks
  //       },
  //       axisBorder: {
  //         show: false // Hides Y-axis border
  //       }
  //     },
  //     grid: {
  //       show: true, // Controls gridlines visibility
  //       xaxis: {
  //         lines: {
  //           show: false // Hides vertical gridlines
  //         }
  //       },
  //       yaxis: {
  //         lines: {
  //           show: false // Hides horizontal gridlines
  //         }
  //       }
        
  //     },
  //     legend: {
  //       show: false // ✅ Hides the legend
  //     }
  //   };
  // }
  
  groupHeatmapDataIntoRows(heatmapData: any[], rows = 3) {
    const groupedData = [];
    const itemsPerRow = Math.ceil(heatmapData.length / rows); // Calculate items per row
  
    // Group the data into rows
    for (let i = 0; i < rows; i++) {
      const start = i * itemsPerRow;
      const end = start + itemsPerRow;
      groupedData.push(heatmapData.slice(start, end));
    }
  
    // Pad rows with empty values (null) to align smaller rows at the bottom
    const maxLength = Math.max(...groupedData.map(group => group.length));
    groupedData.forEach(group => {
      while (group.length < maxLength) {
        group.unshift({ x: null, y: null }); // Add padding at the start of the row
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

  generateCalendarData(apiData: Record<string, number>): void {
    this.calendarData = [];
    const dates = Object.keys(apiData).map((date) => dayjs(date));
    if (dates.length === 0) return;

    const start = dayjs.min(dates)!;
    const end = dayjs.max(dates)!;
    const dataMap = new Map(Object.entries(apiData));
    let current = start;

    const values = Object.values(apiData).filter((v) => v > 0);
    const formatNumber = (num: number) => Math.round(num);

    // No data fallback
    if (values.length === 0) {
        while (current.isBefore(end) || current.isSame(end, "month")) {
            const monthDays: CalendarDay[] = [];
            const monthStart = current.startOf("month");
            const monthEnd = current.endOf("month");
            let day = monthStart;

            while (day.isBefore(monthEnd) || day.isSame(monthEnd, "day")) {
                const dateString = day.format("YYYY-MM-DD");
                monthDays.push({
                    date: dateString,
                    value: 0,
                    colorValue: "#ffffff",
                    backgroundValue: "",
                    rangeName: "No Data",
                });
                day = day.add(1, "day");
            }

            this.calendarData.push({
                name: current.format("MMMM YYYY"),
                weeks: this.generateWeeksForMonth(monthDays),
            });

            current = current.add(1, "month");
        }
        return;
    }

    // Palette from low to high: blue → green → yellow → orange → red
    const fullPalette = ["#0000ff", "#1b901b", "#d7d717", "#ffa500", "#ff0000"];
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const rangeCount = Math.min(5, maxValue === minValue ? 1 : maxValue - minValue + 1);
    const rangeSize = Math.ceil((maxValue - minValue + 1) / rangeCount);
    const colorPalette = fullPalette.slice(-rangeCount); // ✅ Use highest-intensity colors in correct order

    this.colorRanges = [];

    for (let i = 0; i < rangeCount; i++) {
        const rangeStart = minValue + i * rangeSize;
        const rangeEnd = (i === rangeCount - 1) ? maxValue : rangeStart + rangeSize - 1;

        const color = colorPalette[i]; // ✅ Keep color order: low → high

        this.colorRanges.push({
            name: `Range ${rangeStart} - ${rangeEnd}`,
            color,
            start: rangeStart,
            end: rangeEnd,
        });
    }

    const getRangeData = (value: number): { color: string; range: string } => {
        if (value === 0) return { color: "", range: "No Data" };
        const range = this.colorRanges.find(r => value >= r.start && value <= r.end);
        return range ? { color: range.color, range: range.name } : { color: "#ff0000", range: "Very High" };
    };

    while (current.isBefore(end) || current.isSame(end, "month")) {
        const monthDays: CalendarDay[] = [];
        const monthStart = current.startOf("month");
        const monthEnd = current.endOf("month");
        let day = monthStart;

        while (day.isBefore(monthEnd) || day.isSame(monthEnd, "day")) {
            const dateString = day.format("YYYY-MM-DD");
            const value = dataMap.get(dateString) || 0;
            const formattedValue = formatNumber(value);

            const { color, range } = getRangeData(formattedValue);

            monthDays.push({
                date: dateString,
                value: formattedValue,
                colorValue: "#ffffff",
                backgroundValue: color,
                rangeName: range,
            });

            day = day.add(1, "day");
        }

        this.calendarData.push({
            name: current.format("MMMM YYYY"),
            weeks: this.generateWeeksForMonth(monthDays),
        });

        current = current.add(1, "month");
    }
}




//   generateCalendarData(apiData: Record<string, number>): void {
//     this.calendarData = [];
//     const dates = Object.keys(apiData).map((date) => dayjs(date));
//     if (dates.length === 0) return;

//     const start = dayjs.min(dates)!;
//     const end = dayjs.max(dates)!;
//     const dataMap = new Map(Object.entries(apiData));
//     let current = start;

//     // Extract non-zero values for range calculation
//     const values = Object.values(apiData).filter((v) => v > 0);
//     const uniqueValues = Array.from(new Set(values)); // Get unique values
//     uniqueValues.sort((a, b) => a - b); // Sort the values in ascending order

//     // Ensure values are rounded to whole numbers
//     const formatNumber = (num: number) => Math.round(num);

//     // If all values are 0, show "No Data"
//     if (values.length === 0) {
//         while (current.isBefore(end) || current.isSame(end, "month")) {
//             const monthDays: CalendarDay[] = [];
//             const monthStart = current.startOf("month");
//             const monthEnd = current.endOf("month");
//             let day = monthStart;

//             while (day.isBefore(monthEnd) || day.isSame(monthEnd, "day")) {
//                 const dateString = day.format("YYYY-MM-DD");
//                 monthDays.push({
//                     date: dateString,
//                     value: 0,
//                     colorValue: "#ffffff",
//                     backgroundValue: "",
//                     rangeName: "No Data",
//                 });
//                 day = day.add(1, "day");
//             }

//             this.calendarData.push({
//                 name: current.format("MMMM YYYY"),
//                 weeks: this.generateWeeksForMonth(monthDays),
//             });

//             current = current.add(1, "month");
//         }
//         return;
//     }

//     // Calculate the number of ranges (maximum 5)
//     const numRanges = Math.min(uniqueValues.length, 5);
//     const stepSize = Math.floor(uniqueValues.length / numRanges);
    
//     // Generate ranges dynamically, but with a maximum of 5 ranges
//     this.colorRanges = [];
//     const colorPalette = ["#0000ff", "#1b901b", "#d7d717", "#ffa500", "#ff0000"]; // Color options

//     // Ensure there are no repeated values in ranges
//     let lastValue = null;
//     for (let i = 0; i < numRanges; i++) {
//         const startIdx = i * stepSize;
//         const endIdx = Math.min((i + 1) * stepSize, uniqueValues.length);

//         const rangeStart = uniqueValues[startIdx];
//         const rangeEnd = uniqueValues[endIdx - 1];

//         // Prevent duplicate ranges by checking the last value
//         if (rangeStart === lastValue) {
//             continue; // Skip adding this range if it overlaps with the previous range
//         }

//         this.colorRanges.push({
//             name: `Range ${formatNumber(rangeStart)}-${formatNumber(rangeEnd)}`,
//             color: colorPalette[i % colorPalette.length], // Cycle through colors if necessary
//             start: rangeStart,
//             end: rangeEnd
//         });

//         lastValue = rangeEnd; // Update the last value to avoid overlap
//     }

//     // Get color range for value
//     const getRangeData = (value: number): { color: string; range: string } => {
//         if (value === 0) return { color: "", range: "No Data" };

//         // Find the range based on value
//         const range = this.colorRanges.find(r => value >= r.start && value <= r.end);
//         return range ? { color: range.color, range: range.name } : { color: "#ff0000", range: "Very High" };
//     };

//     // Iterate through months
//     while (current.isBefore(end) || current.isSame(end, "month")) {
//         const monthDays: CalendarDay[] = [];
//         const monthStart = current.startOf("month");
//         const monthEnd = current.endOf("month");
//         let day = monthStart;

//         while (day.isBefore(monthEnd) || day.isSame(monthEnd, "day")) {
//             const dateString = day.format("YYYY-MM-DD");
//             const value = dataMap.get(dateString) || 0;
//             const formattedValue = formatNumber(value);

//             const { color, range } = getRangeData(formattedValue);

//             monthDays.push({
//                 date: dateString,
//                 value: formattedValue,
//                 colorValue: "#ffffff",
//                 backgroundValue: color,
//                 rangeName: range,
//             });

//             day = day.add(1, "day");
//         }

//         this.calendarData.push({
//             name: current.format("MMMM YYYY"),
//             weeks: this.generateWeeksForMonth(monthDays),
//         });

//         current = current.add(1, "month");
//     }
// }




  

        
      
        generateWeeksForMonth(monthDays: CalendarDay[]): CalendarWeek[] {
          const weeks: CalendarWeek[] = [];
          let week: CalendarWeek = [];
          monthDays.forEach((day) => {
            week.push(day);
            if (week.length === 7) {
              weeks.push(week);
              week = [];
            }
          });
          if (week.length) weeks.push(week);
          return weeks;
        }
      
        getColor(value: number, data): string {
          const min = Math.min(...data);
          const max = Math.max(...data);
          const mean = data.reduce((sum, v) => sum + v, 0) / data.length;
      
          // Special case: Only one value in the dataset
        if (min === max) {
          return `rgb(255, 0, 0)`; // Default to red for a single value
        }
        // Clamp the value to the range [min, max]
        const clampedValue = Math.min(Math.max(value, min), max);
      
        // Normalize value to a range of 0-1
        const normalized = (clampedValue - min) / (max - min);
      
        // Calculate red and green intensities
         const red = Math.round(255 * normalized);     // Red increases with the value
         const green = Math.round(255 * (1 - normalized)); // Green decreases with the value
      
        // Return the gradient color
        return `rgb(${red}, ${green}, 0)`;
      //  // Clamp the value to the range [min, max]
      //  const clampedValue = Math.min(Math.max(value, min), max);
      
      //  // Map value to a 0-1 range
      //  const normalized = (clampedValue - min) / (max - min);
      
      //  // Calculate red and green intensities
      //  const red = Math.round(255 * normalized);     // Red increases with the value
      //  const green = Math.round(255 * (1 - normalized)); // Green decreases with the value
      
      //  // Return the color in rgb format
      //  return `rgb(${red}, ${green}, 0)`; // Blue is fixed at 0 for shades of red and green
      
      
          // if (value <= mean) {
          //   // Below or at the mean: Lighter red shades
          //   const normalized = (value - min) / (mean - min);
          //   const red = 255;
          //   const green = Math.round(255 * (1 - normalized));
          //   const blue = Math.round(255 * (1 - normalized));
          //   return `rgb(${red}, ${green}, ${blue})`;
          // } else {
          //   // Above the mean: Transition from red to green
          //   const normalized = (value - mean) / (max - mean);
          //   const red = Math.round(255 * (1 - normalized));
          //   const green = Math.round(255 * normalized);
          //   return `rgb(${red}, ${green}, 0)`;
          // }
        }
        
        
      
        getDate(month: string, day: any): string {
          // Create the full date string like '2024-12-01' by combining year, month, and day
          const fullDate = `${day.date}`;
          // Use dayjs to format the full date
          const formattedDate = dayjs(fullDate).format('MMMM DD YYYY');
          return fullDate;
        }
      
        getDayFromDate(fullDate: string): number {
          return dayjs(fullDate).date(); // Extracts the day of the month from the full date
        }
      
      
      //Tooltip positioning functions  
      
      calculateTooltipPosition(event: MouseEvent, day: any): void {
        const dayElement = event.currentTarget as HTMLElement;
        const dayRect = dayElement.getBoundingClientRect();
        const tooltipWidth = 185; // Match your tooltip's min-width
        const tooltipHeight = 100; // Approximate tooltip height
      
        // Horizontal positioning
        let left: number, right: number;
        if (dayRect.right + tooltipWidth <= window.innerWidth) {
          left = dayRect.right;
          right = undefined;
        } else if (dayRect.left - tooltipWidth >= 0) {
          left = dayRect.left - tooltipWidth;
          right = undefined;
        } else {
          left = Math.max(10, window.innerWidth - tooltipWidth - 10);
          right = undefined;
        }
      
        // Vertical positioning
        let top: number, bottom: number;
        if (dayRect.bottom + tooltipHeight <= window.innerHeight) {
          top = dayRect.bottom;
          bottom = undefined;
        } else {
          bottom = window.innerHeight - dayRect.top + 10;
          top = undefined;
        }
      
        this.tooltipPosition[day.date] = {
          position: 'fixed',
          left: left + 'px',
          top: top ? top + 'px' : 'unset',
          bottom: bottom ? bottom + 'px' : 'unset',
          'z-index': 9999999999,
          // Include other styles from your original class
        };
      }
      
      clearTooltipPosition(day: any): void {
        delete this.tooltipPosition[day.date];
      }

      //Update sites count api call
      updateSitesCount(siteId:any){
        const payload ={
         site_id:siteId
        }
        this.satelliteService.updateSitesCount(payload).subscribe({
         next:(resp)=>{
   
         }
        })
       }

        isChecked(site: any): boolean {
             return this.selectedSites.some(s => s.id === site.id); // compare using ID or unique key
           }
           toggleSelection(site: any, event: MatCheckboxChange): void {
             if (event.checked) {
               // Add only if not already present
               const exists = this.selectedSites.some(s => s.id === site.id); // or another unique key
               if (!exists) {
                 this.selectedSites.push(site);
               }
             } else {
               // Remove if present
               this.selectedSites = this.selectedSites.filter(s => s.id !== site.id);
             }
           
             console.log('Current selectedSites:', this.selectedSites);
             this.SharedService.setActiveSites(this.selectedSites)
             const dataArray = this.selectedSites.map(site => {
               const [lon, lat] = site?.coordinates?.coordinates[0][0];
               return {
                 lat,
                 lon,
                 id: site.id,
                 name: site.name
               };
             });
           
             this.SharedService.setSiteMarkerData(dataArray);
           }

           isGroupChecked(group: any): boolean {
            return group.sites.every((site: any) => 
              this.selectedSites.some((s: any) => s.id === site.id)
            );
          }
      
          toggleGroupSelection(group: any, event: MatCheckboxChange): void {
            if (event.checked) {
              // Select all sites in the group
              group.sites.forEach((site: any) => {
                if (!this.selectedSites.some((s: any) => s.id === site.id)) {
                  this.selectedSites.push(site);
                }
              });
            } else {
              // Deselect all sites in the group
              this.selectedSites = this.selectedSites.filter((site: any) => 
                !group.sites.some((groupSite: any) => groupSite.id === site.id)
              );
            }
            
            console.log('Current selectedSites:', this.selectedSites);
            this.SharedService.setActiveSites(this.selectedSites)
            const dataArray = this.selectedSites.map((site: any) => {
              const [lon, lat] = site?.coordinates?.coordinates[0][0];
              return {
                lat,
                lon,
                id: site.id,
                name: site.name
              };
            });
          
            this.SharedService.setSiteMarkerData(dataArray);
          }

           toParseInt(value:any){
            return parseInt(value);
          }
}
