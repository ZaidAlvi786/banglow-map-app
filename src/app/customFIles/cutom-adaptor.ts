import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable({
  providedIn: 'root',
})
export class CustomDateAdapter extends NativeDateAdapter {
    override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
        return ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      }
  override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    const months = super.getMonthNames(style);
    // Remove "November" or any month you want to hide
    return months.filter(month => month !== 'November');
  }
}
