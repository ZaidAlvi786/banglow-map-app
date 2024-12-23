import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import dayjs from "dayjs";

@Component({
  selector: "app-image-preview",
  standalone: true,
  imports: [],
  templateUrl: "./image-preview.component.html",
  styleUrl: "./image-preview.component.scss",
})
export class ImagePreviewComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<ImagePreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  currentIndex:any;
  ngOnInit(): void {
    this.currentIndex = this.data.currentIndex;
    console.log("dialog dat: ", this.data);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getFormattedDate(date: Date): string {
        return dayjs(date).format('MM.DD.YYYY');
    }
    formatUtcTime(payload: string | Date): string {
      // If payload is a string, convert it to Date first
      const date = new Date(payload);
    
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date passed');
      }
    
      // Get the UTC hours and minutes
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    
      // Return formatted time in "HH:mm UTC" format
      return `${hours}:${minutes} UTC`;
    }
    previousImage() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      } else {
        this.currentIndex = this.data.images.length - 1; // Wrap around to the last image
      }
    }
  
    nextImage() {
      if (this.currentIndex < this.data.images.length - 1) {
        this.currentIndex++;
      } else {
        this.currentIndex = 0; // Wrap around to the first image
      }
    }
}
