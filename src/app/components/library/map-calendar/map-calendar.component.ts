import { CommonModule } from "@angular/common";
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from "@angular/core";
import dayjs from "dayjs";
import minMax from "dayjs/plugin/minMax";
import { legends_calendar } from "../../shared/calrendar-range-colos";
dayjs.extend(minMax);

type CalendarDay = {
  date: string;
  value: number | null;
  colorValue: string;
  backgroundValue: string;
};
type CalendarWeek = CalendarDay[];
type CalendarMonth = { name: string; weeks: CalendarWeek[] };

@Component({
  selector: "app-map-calendar",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./map-calendar.component.html",
  styleUrls: ["./map-calendar.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapCalendarComponent implements OnInit {
  // @Input() calendarApiData: Record<string, number> = {};
  @Output() dateRangeSelected = new EventEmitter<{
    start: dayjs.Dayjs;
    end: dayjs.Dayjs;
  }>();

  weekDays: string[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  calendarData: CalendarMonth[] = [];
  showCalendar: boolean = true;
  @Input() endDateCal:any
  @Input() startDateCal:any;

  @Output() calendarEventsOpen = new EventEmitter();
  private _calendarApiData:any
  @Input()
  set calendarApiData(value: any) {
    if (value !== this._calendarApiData) {
      this._calendarApiData = value;
      console.log('_calendarApiData _calendarApiData _calendarApiData:', this._calendarApiData);
      this.generateCalendarData(this._calendarApiData);
      // Add logic to handle the updated value, e.g., validate the date range
    }
  }

  get calendarApiData(): any {
    return this._calendarApiData;
  };

  ngOnInit(): void {
  }

  closeEventCalendar(): void {
    this.showCalendar = false;
    this.calendarEventsOpen.emit()
    console.log("Calendar closed.");
  }

  generateCalendarData(apiData: Record<string, number>): void {
    // Clear the existing calendarData
    this.calendarData = [];
  
    const dates = Object.keys(apiData).map((date) => dayjs(date));
    const start = dayjs.min(dates)!;
    const end = dayjs.max(dates)!;
    const dataMap = new Map(Object.entries(apiData));
    let current = start;
  
    while (current.isBefore(end) || current.isSame(end, "month")) {
      const monthDays: CalendarDay[] = [];
      const monthStart = current.startOf("month");
      const monthEnd = current.endOf("month");
      let day = monthStart;
  
      while (day.isBefore(monthEnd) || day.isSame(monthEnd, "day")) {
        const dateString = day.format("YYYY-MM-DD");
        const value = dataMap.get(dateString) || null;
        monthDays.push({
          date: dateString,
          value,
          colorValue: "#ffffff",
          backgroundValue: value && value > 0 ? this.getColor(value,  Object.values(apiData)) : "",
        });
        day = day.add(1, "day");
      }
  
      this.calendarData.push({
        name: current.format("MMMM"),
        weeks: this.generateWeeksForMonth(monthDays),
      });
  
      current = current.add(1, "month");
    }
  }
  

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

  getRandomDarkColor(): string {
    // Generate random RGB values biased towards darker colors
    const red = Math.floor(Math.random() * 128); // Range: 0–127
    const green = Math.floor(Math.random() * 128); // Range: 0–127
    const blue = Math.floor(Math.random() * 128); // Range: 0–127
  
    // Convert to rgb format
    return `rgb(${red}, ${green}, ${blue})`;
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
  
  // getColor(value: number): string {
  //   // Generate a random color for the text
  //   return this.getRandomDarkColor();
  // }
  
  getBackgroundColor(value: number): string {
    const matchedRange = legends_calendar.find(
      range => value >= range.min && value <= range.max
    );
    return matchedRange?.color; // Default to black if no match
  }
  getDate(month: string, day: any): string {
    // Create the full date string like '2024-12-01' by combining year, month, and day
    const fullDate = `${day.date}`;
    // Use dayjs to format the full date
    const formattedDate = dayjs(fullDate).format('MMMM DD YYYY');
    console.log(fullDate, 'formatted date');
    return fullDate;
  }

  getDayFromDate(fullDate: string): number {
    return dayjs(fullDate).date(); // Extracts the day of the month from the full date
  }
}
