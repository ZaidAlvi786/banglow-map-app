import { AfterViewInit, Component, ElementRef, EventEmitter, inject, OnInit, Output, ViewChild } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { NgApexchartsModule } from 'ng-apexcharts';
import ApexCharts from 'apexcharts';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SatelliteService } from '../../services/satellite.service';
import dayjs from 'dayjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, debounceTime, of, Subject, switchMap } from 'rxjs';
import { NgxUiLoaderModule, NgxUiLoaderService } from 'ngx-ui-loader';
import { DateFormatPipe } from '../../pipes/date-format.pipe';

@Component({
  selector: 'app-sites',
  standalone: true,
  imports: [MatInputModule,
    NgApexchartsModule, 
    MatMenuModule, 
    CommonModule, 
    MatInputModule, 
    MatFormFieldModule, 
    ReactiveFormsModule, 
    FormsModule, 
    NgxUiLoaderModule,
    DateFormatPipe
  ],
  templateUrl: './sites.component.html',
  styleUrl: './sites.component.scss'
})
export class SitesComponent implements OnInit, AfterViewInit {
  @Output() closeDrawer = new EventEmitter<boolean>();
  private _snackBar = inject(MatSnackBar);
  options: any;
  notification: boolean = false;
  name: string = ''
  sitesData: any[] = [];
  searchInput = new Subject<string>();
  @ViewChild('scrollableDiv') scrollableDiv!: ElementRef<HTMLDivElement>;
  private canTriggerAction = true;
  private isAtBottom = false;
  per_page = 12;
  total_count: any;
  loader: boolean = false;
  closeLibraryDrawer() {
    this.closeDrawer.emit(true);
  }
  ngOnInit(): void {

    let queryParams = {
      page_number: 1,
      per_page: 12,
      name: '',
    }
    this.loader = true
    this.ngxLoader.start();
    this.getSitesData(queryParams)
  }
  constructor(private sateliteService: SatelliteService,
    private ngxLoader: NgxUiLoaderService
  ) {
    this.options = {}

    this.searchInput.pipe(
      debounceTime(1000),  // Wait for 1000ms after the last key press
      switchMap((inputValue) => {
        let queryParams = {
          page_number: '1',
          per_page: '12',
          name: inputValue,
        }
        this.loader = true
        this.ngxLoader.start();
        return this.sateliteService.getSites(queryParams).pipe(
          catchError((err) => {
            this.loader = false
            this.ngxLoader.stop();
            console.error('API error:', err);
            // Return an empty array to allow subsequent API calls to be made
            return of({ data: [] });
          })
        );
      })
    ).subscribe({
      next: (resp: any) => {
        this.loader = false
        this.ngxLoader.stop();
        console.log(resp, 'API Response');
        this.sitesData = resp?.data;
      },
      error: (err: any) => {
        console.error('API call failed', err);
      }
    });
  }
  ngAfterViewInit(): void {
    const div = this.scrollableDiv.nativeElement;

    // Add scroll event listener

    div.addEventListener('wheel', this.handleWheelEvent);
  }

  //heatmap chart initialization functionality
  initializeCharts() {
    for (let i = 0; i < this.sitesData.length; i++) {
      const chartElement = document.querySelector(`#chart${i}`);
      if (chartElement && !chartElement.hasChildNodes()) {
        const heatmapData = this.sitesData[i].heatmap.map((item: { date: string; count: number }) => ({
          x: item.date,
          y: item.count,
        }));

        const chartOptions = {
          ...this.options,
          series: [
            {
              name: `Site ${i + 1}`,
              data: heatmapData,
            },
          ],
        };

        const chart = new ApexCharts(chartElement, chartOptions);
        chart.render()
          .then(() => console.log(''))
          .catch((err: any) => console.error(`Error rendering chart ${i}:`, err));
      }
    }
  }

  //Heatmap chart data generate function
  generateData(count: number, range: { min: number, max: number }) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min);
  }

  //Date format functions
  getFormattedDate(date: Date): string {
    return dayjs(date).format('MM.DD.YYYY');
  }

  //Getting sites data
  getSitesData(queryParams: any) {
    this.sateliteService.getSites(queryParams).subscribe({
      next: (resp) => {
        console.log(resp, 'successsuccesssuccesssuccesssuccess');
        this.sitesData = resp.data;
        this.total_count = resp.total_count
        this.loader = false
        this.ngxLoader.stop();
        const colorRanges = this.generateUniqueColorRanges(this.sitesData);
        console.log(colorRanges, 'colorRangescolorRangescolorRangescolorRanges');

        this.options = {
          chart: {
            height: 105,
            width: '255px',
            type: 'heatmap',
            toolbar: {
              show: false,
            },
          },
          plotOptions: {
            heatmap: {
              shadeIntensity: 0.5,
              radius: 0,
              useFillColorAsStroke: true,
              columnWidth: '21px',
              rowHeight: '21px',
              colorScale: {
                ranges: colorRanges.map(range => ({
                  from: range.from,
                  to: range.to,
                  name: '',
                  color: range.color,
                }))
              }
            },
          },
          dataLabels: {
            enabled: false,
          },
          stroke: {
            show: true,               // Enable borders
            width: 1,                 // Set the width of the border
            colors: '#FFFFFF'         // Set the border color, you can change this to any color
          },
          legend: {
            show: false,
          },
          xaxis: {
            labels: {
              show: false, // Hides the x-axis labels
            },
            axisBorder: {
              show: false, // Hides the x-axis line
            },
            axisTicks: {
              show: false, // Hides the x-axis ticks
            },
          },
          yaxis: {
            labels: {
              show: false
            }
          }
        };
        setTimeout(() => {
          this.initializeCharts();
        }, 300)

      },
      error: (err: any) => {
        this.loader = false
        this.ngxLoader.stop();
        console.error('API call failed', err);
      }
    })
  }

  //Patch name value into input field
  patchNameValue(site: any) {
    this.name = site.name
  }

  //Notifications ative status 
  notificatioStatus(type: boolean, site: any) {
    this.notification = type;
    console.log(site, 'sitesitesitesitesitesitesite');
    const payload = {
      site_id: site.id,
      name: site.name,
      notification: type,
      is_deleted: false,
    }

    this.sateliteService.updateSite(payload).subscribe({
      next: (resp) => {
        let queryParams = {
          page_number: '1',
          per_page: '12',
          name: '',
        }
        this.getSitesData(queryParams)

      }
    })

  }

  //Site update functionality
  updateSite(type: any, site: any) {
    let payload: any
    console.log(site, 'updateupdateupdateupdateupdate');

    if (type == 'rename') {
      payload = {
        site_id: site.id,
        name: this.name,
        notification: site.notification,
        is_deleted: false,
      }
      const updatedSitesData = this.sitesData.map((item: any) =>
        item.id === site.id ? { ...site, name: this.name } : item
      );
      this.sitesData = updatedSitesData
    } else if (type == 'delete') {
      payload = {
        site_id: site.id,
        name: site.name,
        notification: site.notification,
        is_deleted: true,
      }
      const index = this.sitesData.findIndex((item) => item.id === site.id);

      // Remove the object if found
      if (index !== -1) {
        this.sitesData.splice(index, 1); // Removes 1 element at the found index
      }

    } else {
      payload = {
        site_id: site.id,
        name: site.name,
        notification: type,
        is_deleted: false,
      }

      const updatedSitesData = this.sitesData.map((item: any) =>
        item.id === site.id ? { ...site, notification: type } : item
      );
      this.sitesData = updatedSitesData
    }
    this.sateliteService.updateSite(payload).subscribe({
      next: (resp) => {
        if (resp) {
          this._snackBar.open('Site updated successfully.', 'Ok', {
            duration: 2000  // Snackbar will disappear after 300 milliseconds
          });
        }


      }
    })
  }

  //On Keypress filter sites data
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

  //On scroll site data getting
  private handleWheelEvent = (event: WheelEvent): void => {
    const div = this.scrollableDiv.nativeElement;

    // Detect if at the bottom
    const isAtBottom = div.scrollTop + div.clientHeight >= div.scrollHeight;
    console.log(isAtBottom, 'qqqqqqqqqqqqqqqqqqqqqqqqqqq');

    // Only trigger if at the bottom and trying to scroll down
    if (isAtBottom && event.deltaY > 0 && this.canTriggerAction) {
      console.log('sssssssssssssssssssss');

      if (!this.isAtBottom) {
        this.isAtBottom = true; // Lock the event trigger
        //  this.customAction('Scroll beyond bottom');


        this.per_page = this.per_page + 12;
        this.per_page > this.total_count ? this.per_page = this.total_count : this.per_page
        console.log(this.per_page, 'per_pageper_pageper_pageper_pageper_page');

        if (this.per_page <= this.total_count) {


          this.loader = true
          this.ngxLoader.start(); // Start the loader
          let payload = {
            page_number: '1',
            per_page: this.per_page,
            name: '',
          }
          this.sateliteService.getSites(payload).subscribe({
            next: (resp) => {
              this.loader = false
              this.ngxLoader.stop(); // Stop the loader when the data is successfully fetched
            },
            error: (err) => {
              console.log("err getPolyGonData: ", err);
              this.loader = false
              this.ngxLoader.stop(); // Stop the loader even if there is an error
            }
          });
        }

        // Set debounce flag to false and reset it after 3 seconds
        this.canTriggerAction = false;
        setTimeout(() => {
          this.canTriggerAction = true;
          this.isAtBottom = false; // Reset at bottom flag
        }, 3000); // 3 seconds delay
      }
    }
  };
  usedColors = new Set<string>();
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

  // Generate unique color ranges for each value
  generateUniqueColorRanges(data: any): any[] {
    const ranges = [];

    data.forEach((value, index) => {
      value.heatmap.forEach((item) => {
        ranges.push({
          from: item.count,
          to: item.count,
          color: this.generateColor()
        });
      });
    });

    return ranges;
  }
}

