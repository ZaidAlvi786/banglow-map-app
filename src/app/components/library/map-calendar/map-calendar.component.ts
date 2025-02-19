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
  rangeName: string 
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
  hoveredRange: string | null = null;
  @Output() calendarEventsOpen = new EventEmitter();
  private _calendarApiData:any
  @Input()
  set calendarApiData(value: any) {
    if (value !== this._calendarApiData) {
      this._calendarApiData = value;
      this.generateCalendarData(this._calendarApiData);
      // Add logic to handle the updated value, e.g., validate the date range
    }
  }

  get calendarApiData(): any {
    return this._calendarApiData;
  };

  tooltipPosition: any = {};
  colorRanges = [
    { name: "Very Low", color: "#70ed8b" }, // Light Green
    { name: "Low", color: "#5bc06c" }, // Medium Green
    { name: "Medium", color: "#319a43" }, // Darker Green
    { name: "High", color: "#12561d" }, // Yellow
    { name: "Very High", color: "#bf4e4e" }, // Orange
    { name: "Extreme", color: "#ff0000" } // Red
]
  ngOnInit(): void {
  }

  closeEventCalendar(): void {
    this.showCalendar = false;
    this.calendarEventsOpen.emit()
  }

  generateCalendarData(apiData: Record<string, number>): void {
    // Clear existing calendar data
    this.calendarData = [];

    const dates = Object.keys(apiData).map((date) => dayjs(date));
    if (dates.length === 0) return;

    const start = dayjs.min(dates)!;
    const end = dayjs.max(dates)!;
    const dataMap = new Map(Object.entries(apiData));
    let current = start;

    // Get the maximum value from apiData (minimum threshold is 200)
    const actualMax = Math.max(...Object.values(apiData));
    const maxValue = Math.max(actualMax, 200);

    // Define function to determine range and color
    const getRangeData = (value: number): { color: string; range: string } => {
        if (value === 0) return { color: "", range: "No Data" }; // White for zero values
        if (value <= maxValue * 0.1) return { color: "#70ed8b", range: "Very Low" }; // Light Green
        if (value <= maxValue * 0.3) return { color: "#5bc06c", range: "Low" }; // Medium Green
        if (value <= maxValue * 0.5) return { color: "#319a43", range: "Medium" }; // Darker Green
        if (value <= maxValue * 0.7) return { color: "#12561d", range: "High" }; // Yellow
        if (value <= maxValue * 0.9) return { color: "#bf4e4e", range: "Very High" }; // Orange
        return { color: "#ff0000", range: "Extreme" }; // Red
    };

    while (current.isBefore(end) || current.isSame(end, "month")) {
        const monthDays: CalendarDay[] = [];
        const monthStart = current.startOf("month");
        const monthEnd = current.endOf("month");
        let day = monthStart;

        while (day.isBefore(monthEnd) || day.isSame(monthEnd, "day")) {
            const dateString = day.format("YYYY-MM-DD");
            const value = dataMap.get(dateString) || 0; // Default to 0 if no value

            // Get background color and range category
            const { color, range } = getRangeData(value);

            monthDays.push({
                date: dateString,
                value,
                colorValue: '#ffffff',
                backgroundValue: color,
                rangeName: range, // Store the category name
            });

            day = day.add(1, "day");
        }

        this.calendarData.push({
            name: current.format("MMMM YYYY"), // Includes the year
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
}
