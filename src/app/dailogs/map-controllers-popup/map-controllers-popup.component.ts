import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

import dayjs from 'dayjs';
import { SatelliteService } from '../../services/satellite.service';
import { GroupsListComponent } from '../../common/groups-list/groups-list.component';
import { catchError, debounceTime, of, Subject, switchMap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import moment from 'moment';

export class Group {
  name?: string;
  icon?: string; // icon name for Angular Material icons
  children?: Group[]; // nested groups
}

@Component({
  selector: 'app-map-controllers-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatCheckboxModule,
    MatListModule,
    MatIconModule,
    GroupsListComponent
  ],
  templateUrl: './map-controllers-popup.component.html',
  styleUrls: ['./map-controllers-popup.component.scss']
})
export class MapControllersPopupComponent implements OnInit {
  @ViewChild('myTemplate', { static: true }) myTemplate!: TemplateRef<any>;
  selectedTimeFrame: any = 1;
  renderGroup!: TemplateRef<any> | null;
  checked: boolean = false;
  groups: Group[] = [
    // Add more groups as needed
  ];
  activeTimeDate: any
  searchInput = new Subject<string>();
  name: string = "Untitled point";
  pointData: any
  addGroup: boolean = false;
  selectedGroup: any = null;
  activeGroup: any;
  private snackBar = inject(MatSnackBar);
  @ViewChild(GroupsListComponent) childComponent!: GroupsListComponent;
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  siteData: any;
  isHovered:boolean = false;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
    private satelliteService: SatelliteService,) {
    // Apply debounceTime to the Subject and switch to the latest observable (API call)
    this.searchInput.pipe(
      debounceTime(1000),  // Wait for 1000ms after the last key press
      switchMap((inputValue) => {
        const data = { group_name: inputValue };
        return this.satelliteService.getGroupsForAssignment(data).pipe(
          catchError((err) => {
            console.error('API error:', err);
            // Return an empty array to allow subsequent API calls to be made
            return of({ data: [] });
          })
        );
      })
    ).subscribe({
      next: (resp) => {
        console.log(resp, 'API Response');
        this.groups = resp?.data;
      },
      error: (err) => {
        console.error('API call failed', err);
      }
    });
  }

  ngOnInit(): void {
    console.log(this.data, 'datataatatatatatattat');
    this.renderGroup = this.myTemplate;
    this.activeTimeDate = this.data?.markerData?.percentages[this.selectedTimeFrame]
    if (this.data.type === 'marker') {
      this.handleMarkerAdded(this.data.pointData)
    } else {
      this.pointData = this.data.shapeData
    }

  }

  activeTimeFrame(time: any) {
    this.selectedTimeFrame = time;
    this.activeTimeDate = this.data?.markerData?.percentages[time]
  }

  formatDate(date: any) {
    return dayjs(date).format('DD.MM.YY');
  }

  getGroups() {
    this.selectedGroupEvent(null)
    if (this.addGroup) {
      const data = {
        group_name: ''
      }
      this.satelliteService.getGroupsForAssignment(data).subscribe({
        next: (resp) => {
          console.log(resp, 'respresprespresprespresprespresprespresp');
          this.groups = resp

        }
      })
    } else {
      this.snackBar.open('Please first add site.', 'Close', {
        duration: 3000,
        verticalPosition: 'top',
      });
    }

  }

  onKeyPress(event: KeyboardEvent): void {
    const inputValue = (event.target as HTMLInputElement).value;
    console.log(inputValue, 'inputValueinputValueinputValue'); // Log the current input value to the console
    const data = {
      group_name: inputValue
    }
    // this.satelliteService.getGroupsForAssignment(data).subscribe({
    //   next: (resp) => {
    //     console.log(resp,'respresprespresprespresprespresprespresp');

    //     this.groups = resp?.data

    //   }})
    console.log(this.searchInput, 'searchiiiiiiiiiiiiiiiii');

    this.searchInput.next(inputValue);
  }

  getTimeIfWithin24Hours(acquisition_datetime: string): string | null {
    // Convert the acquisition_datetime string into a Date object
    const acquisitionDate = new Date(acquisition_datetime);

    // Get the current date and time
    const currentDate = new Date();

    // Calculate the difference between the current date and acquisition date in milliseconds
    const timeDifference = currentDate.getTime() - acquisitionDate.getTime();

    // Define 24 hours in milliseconds (24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

    // Check if the acquisition date is within the last 24 hours
    if (timeDifference <= twentyFourHoursInMs) {
      // If it's within 24 hours, return the time portion of the date (formatted as needed)
      return acquisitionDate.toLocaleTimeString(); // You can adjust the format if needed
    }

    // Return null if the acquisition date is not within the last 24 hours
    return dayjs(acquisition_datetime).format('DD.MM.YY');;
  }

  //Function to generate circle plygon when marker added to the map
  handleMarkerAdded(data: any) {
    console.log(data, 'mark');

    const payload = {
      latitude: data.latitude,
      longitude: data.longitude,
      distance_km: 1
    }
    this.satelliteService.generateCirclePolygon(payload).subscribe({
      next: (resp) => {

        this.pointData = resp.data;
        console.log('pointDatapointDatapointData', resp);
      }
    })
  }

  //Add site to the group

  addSite() {
    let payload
    if (this.pointData) {
      payload = {
        name: this.name,
        coordinates_record: {
          type: "Polygon",
          coordinates: this.pointData?.coordinates
        },
        site_type: this.pointData?.type
      }
    } else {
      console.log('kkkkkkkkkk');
      
      payload = {
        name: this.name,
        coordinates_record: {
          type: "Polygon",
          coordinates: this.data.vendorData?.coordinates_record?.coordinates
        },
        site_type: this.data.vendorData?.coordinates_record?.coordinates[0].length > 5 ? 'Polygon' : 'Rectangle'
      }
    }

    this.satelliteService.addSite(payload).subscribe({
      next: (resp) => {
        this.snackBar.open('Site has been added.', 'Ok', {
          duration: 2000  // Snackbar will disappear after 300 milliseconds
        });
        console.log(resp, 'successsuccesssuccesssuccess');
        this.siteData = resp
        this.addGroup = true;  // This will execute if the API call is successful

      },
      error: (err) => {
        console.error('Error occurred:', err);

        this.addGroup = false;



      }
    });

  }

  selectedGroupEvent(event: any) {
    console.log(event, 'selectedeventeventeventevent');
    this.activeGroup = event
  }

  saveGroup() {
    this.selectedGroup = this.activeGroup.group
    const payload = {
      group_id: this.selectedGroup.id,
      site_id: this.siteData.id
    }
    this.satelliteService.addGroupSite(payload).subscribe({
      next: (res) => {
        console.log(res, 'updatedaaaaaaaaaaaaaaaaaa');
        this.snackBar.open(res.message, 'Ok', {
          duration: 2000  // Snackbar will disappear after 300 milliseconds
        });
      },
      error: (err) => {

      }
    })
    this.closeMenu()
  }
  closeMenu() {
    // Close the menu
    if (this.menuTrigger) {
      this.menuTrigger.closeMenu();
    }
  }

  copyToClipboard(data: any): void {
    if (data) {
      // Create a temporary input element to copy text
      const inputElement = document.createElement('input');
      inputElement.value = data;
      document.body.appendChild(inputElement);
      inputElement.select();
      document.execCommand('copy');
      document.body.removeChild(inputElement);

      // Optionally alert the user

      this.snackBar.open('Address copied to clipboard!', 'Ok', {
        duration: 2000  // Snackbar will disappear after 300 milliseconds
      });
    }
  }

  getDateTimeFormat(dateTime: string) {
    if (dateTime) {
      return moment(dateTime, 'YYYY-MM-DD HH:mm:ss')?.format('YYYY-MM-DD HH:mm:ss')

    }
    return '';
  }

   // Function to toggle hover state
   toggleHover(state: boolean): void {
    this.isHovered = state;
  }
}
