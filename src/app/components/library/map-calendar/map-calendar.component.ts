import { Component, EventEmitter, Output } from "@angular/core";
import dayjs from "dayjs";
import { NgxDaterangepickerMd } from "ngx-daterangepicker-material";
import { SharedService } from "../../shared/shared.service";

@Component({
  selector: "app-map-calendar",
  standalone: true,
  imports: [NgxDaterangepickerMd],
  templateUrl: "./map-calendar.component.html",
  styleUrl: "./map-calendar.component.scss",
})
export class MapCalendarComponent {
  startDate: dayjs.Dayjs = dayjs(); // Initialize with current date
  endDate: dayjs.Dayjs = dayjs().add(0, "days"); // Initialize with 1 day later
  maxDate: dayjs.Dayjs = dayjs();

  constructor(private sharedService:SharedService){}

  choosedDate(event: any) {
    console.log("Selected Date and Time Range:", event);
  }

  closeEventCalendar(){
    this.sharedService.setIsOpenedEventCalendar(false);
  }

  calendarsData = [
    { month: "September" },
    { month: "August" },
    { month: "October" },
    { month: "January" },
  ];
}
