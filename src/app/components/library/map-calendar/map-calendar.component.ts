import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import dayjs from "dayjs";
import { NgxDaterangepickerMd } from "ngx-daterangepicker-material";
import { SharedService } from "../../shared/shared.service";
import { CommonModule } from "@angular/common";
import { SatelliteService } from "../../../services/satellite.service";
import minMax from "dayjs/plugin/minMax";
import { LoadingService } from "../../../services/loading.service";
dayjs.extend(minMax);

type CalendarDay = { date: string; value: number | null; colorValue:any,backgroundValue:any };
type CalendarWeek = { date: number; value: number; colorValue:any,backgroundValue:any }[];
type CalendarMonth = { name: string; weeks: CalendarWeek[] };
@Component({
  selector: "app-map-calendar",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./map-calendar.component.html",
  styleUrls: ["./map-calendar.component.scss"],
})
export class MapCalendarComponent implements OnInit {
  startDate: dayjs.Dayjs = dayjs(); // Initialize with current date
  endDate: dayjs.Dayjs = dayjs().add(0, "days"); // Initialize with current date
  maxDate: dayjs.Dayjs = dayjs();
  @Input() polygon_wkt:any
  @Input() calendarApiData:any
  @Output() dateRangeSelected = new EventEmitter<{ start: dayjs.Dayjs; end: dayjs.Dayjs }>();
  weekDays: string[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  // Dynamically populated calendar data
  calendarData: { name: string; weeks: { date: number; value: number,colorValue:any,backgroundValue:any }[][] }[] = [];
  events: { date: string; value: number }[] = [
    { date: "2024-08-01", value: 2 },
    { date: "2024-08-15", value: 5 },
    { date: "2024-09-07", value: 4 },
    { date: "2024-10-19", value: 7 },
    { date: "2024-11-11", value: 1 },
    { date: "2024-12-19", value: 5 },
    { date: "2025-01-23", value: 3 },
  ];
  @Input() endDateCal:any
  @Input() startDateCal:any
  showCalendar:boolean = false
  constructor(private sharedService:SharedService,
    private satelliteService:SatelliteService,
    private loadingService: LoadingService
  ){}

  ngOnInit(): void {
    console.log(this.calendarApiData,'inputting polygoninputting polygoninputting polygoninputting polygon');
    if(this.calendarApiData){
      this.generateCalendarData(this.calendarApiData);
      // const payload = {
      //   polygon_wkt: this.polygon_wkt,
      //   start_date: this.startDateCal,
      //   end_date: this.endDateCal
      // }
      
      // // Start the loader
      // this.loadingService.show();
    
      // this.satelliteService.getPolygonCalenderDays(payload).subscribe({
      //   next: (resp) => {
      //     console.log(resp, 'getPolygonCalenderDaysgetPolygonCalenderDaysgetPolygonCalenderDays');
      //     this.generateCalendarData(resp.data);
      //   },
      //   error: (err) => {
      //     console.error('Error fetching calendar data', err);
      //     // Hide loader on error
      //     this.loadingService.hide();
      //   },
      //   complete: () => {
      //     // Hide loader once the data is loaded and processed
      //     console.log('Complete loading calendar data');
      //     this.showCalendar = true
      //     this.loadingService.hide();
      //   }
      // });
    }
    
    
  }
  choosedDate(event: any) {
    console.log("Selected Date and Time Range:", event);
    this.dateRangeSelected.emit({ start: dayjs(event.startDate), end: dayjs(event.endDate) });
  }

  // Close calendar event
  closeEventCalendar() {
    this.showCalendar = false;
    this.sharedService.setIsOpenedEventCalendar(false);
  }

  generateCalendarData(apiData: Record<string, number>) {
    // Extract all the dates from the API data and find the earliest and latest dates
    const dates = Object.keys(apiData).map((date) => dayjs(date));
    const start = dayjs.min(dates)!; // Earliest date from the API data
    const end = dayjs.max(dates)!; // Latest date from the API data
  
    // Create a map for quick lookup of values by date
    const dataMap = new Map(Object.entries(apiData));
  
    let current = start;
  
    while (current.isBefore(end) || current.isSame(end, "month")) {
      const monthStart = current.startOf("month");
      const monthEnd = current.endOf("month");
  
      // Generate data for the month
      const monthDays: CalendarDay[] = [];
      let day = monthStart;
  
      while (day.isBefore(monthEnd) || day.isSame(monthEnd, "day")) {
        const dateString = day.format("YYYY-MM-DD");
        const value = dataMap.get(dateString) || null;
  
        monthDays.push({
          date: dateString,
          value: value,
          colorValue: value && value > 0 ? this.generateColor('color') : "", // Default to white
          backgroundValue: value && value > 0 ? this.generateColor('background'):"#ffffff"
        });
  
        day = day.add(1, "day");
      }
  
      const month = {
        name: current.format("MMMM"),
        weeks: this.generateWeeksForMonth(monthDays),
      };
  
      this.calendarData.push(month);
      current = current.add(1, "month");
    }
  }
  
  generateWeeksForMonth(monthDays: CalendarDay[]) {
    const weeks: CalendarWeek[] = [];
    let week: CalendarWeek = [];
  
    monthDays.forEach((day) => {
      const dayValue = day.value || 0; // Get the value for the day or default to 0
      week.push({
        date: dayjs(day.date).date(),
        value: dayValue,
        colorValue: dayValue>0 ? day.colorValue : '', // Include colorValue
        backgroundValue: dayValue >0 ? day.backgroundValue :''

      });
  
      // If the week is complete or the last day of the month, push the week
      if (week.length === 7 || day.date === monthDays[monthDays.length - 1].date) {
        weeks.push(week);
        week = [];
      }
    });
  
    return weeks;
  }
  
  // Function to generate a hex color based on the value
  generateHexColor(value: number): string {
    // Normalize the value to a range between 0 and 255
    const normalizedValue = Math.min(255, Math.max(0, value * 10));
    const red = (normalizedValue + 50) % 256; // Adjust red channel
    const green = (normalizedValue * 2) % 256; // Adjust green channel
    const blue = (normalizedValue * 3) % 256; // Adjust blue channel
  
    // Convert to a hex string and pad with leading zeros if needed
    return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)}`;
  }
  
  

  getDayClass(day: { date: number; value: number }): string {
    if (day.value === 0) return '';
    if (day.value <= 2) return 'color-1';
    if (day.value <= 4) return 'color-2';
    if (day.value <= 6) return 'color-3';
    return 'color-4';
  }

  getDate(month: string, day: any): string {
    // Create the full date string like '2024-12-01' by combining year, month, and day
    const fullDate = `2024-${month}-${day.date}`;
    // Use dayjs to format the full date
    const formattedDate = dayjs(fullDate).format('MMMM DD YYYY');
    console.log(fullDate, 'formatted date');
    return fullDate;
  }

  usedColors = new Set<string>();
  // Dynamically generate colors using HSL
  generateColor(type:any): string {
    if(type === 'color'){
      let color: string;
  
      // Keep generating random colors until a new one is found
      do {
        const hue = 255; // Random hue between 0 and 360
        const saturation = 255; // Vibrant colors (can be adjusted)
        const lightness = 255; // Balanced brightness (can be adjusted) 
        
        color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      } while (this.usedColors.has(color)); // Keep generating until a unique color is found
    
      // Store the new color to avoid using it again
      this.usedColors.add(color);
    
      return color;
    } else{
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
    
  }
}
