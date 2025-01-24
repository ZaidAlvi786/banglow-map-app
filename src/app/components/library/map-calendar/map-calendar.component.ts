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
  }
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
          backgroundValue: value && value > 0 ? this.getBackgroundColor(value) : "",
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
  
  getColor(value: number): string {
    // Generate a random color for the text
    return this.getRandomDarkColor();
  }
  
  getBackgroundColor(value: number): string {
    // Generate a random color for the background
    return this.getRandomDarkColor();
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
