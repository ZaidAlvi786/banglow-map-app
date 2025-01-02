import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
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
export class ImagePreviewComponent implements OnInit,AfterViewInit {
  constructor(
    public dialogRef: MatDialogRef<ImagePreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  currentIndex:any;
  ngOnInit(): void {
    this.currentIndex = this.data.currentIndex;
    console.log("dialog dat: ", this.data.images.data);
  }

  ngAfterViewInit() {
    this.adjustImageHeight();
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
        this.currentIndex = this.data.images.data.length - 1; // Wrap around to the last image
      }
    }
  
    nextImage() {
      if (this.currentIndex < this.data.images.data.length - 1) {
        this.currentIndex++;
      } else {
        this.currentIndex = 0; // Wrap around to the first image
      }
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        this.previousImage(); // Call previousImage() on left arrow key press
      } else if (event.key === 'ArrowRight') {
        this.nextImage(); // Call nextImage() on right arrow key press
      }
    }

    adjustImageHeight() {
      const dialogContainer = document.querySelector('.dialog-content');
      const image = document.querySelector('.resizable-image') as HTMLImageElement;
      console.log(dialogContainer?.clientHeight,'dialogContainer.clientHeightdialogContainer.clientHeight');
      
      if (dialogContainer && image) {
        const dialogHeight = dialogContainer.clientHeight;
        image.style.height = `${dialogHeight}px`; // Adjust the image height to match the dialog height
      }
    }
}
