import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import moment from 'moment';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {

  transform(value: string | Date): string {
    return dayjs(value).utc().format('YYYY-MM-DD');
  }

}

@Pipe({
  name: 'timeFormat',
  standalone: true,
})
export class TimeFormatPipe implements PipeTransform {
  transform(value: string | Date): string {
    return dayjs(value).utc().format('HH:mm:ss');
  }
}

@Pipe({
  name: 'dateTimeFormat',
  standalone: true,
})
export class DateTimeFormatPipe implements PipeTransform {
  transform(value: string | Date): string {
    return moment(value, 'YYYY-MM-DD    HH:mm:ss')?.format('YYYY-MM-DD     HH:mm:ss');;
  }
}