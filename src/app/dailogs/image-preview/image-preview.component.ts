import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
  signal,
  viewChild,
  ViewChild,
} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import dayjs from "dayjs";
import { DateFormatPipe, TimeFormatPipe } from "../../pipes/date-format.pipe";
import { NgxPanZoomModule, PanZoomComponent, PanZoomModel } from "ngx-panzoom";

@Component({
  selector: "app-image-preview",
  standalone: true,
  imports: [CommonModule,DateFormatPipe,TimeFormatPipe, NgxPanZoomModule],
  templateUrl: "./image-preview.component.html",
  styleUrl: "./image-preview.component.scss",
})
export class ImagePreviewComponent implements OnInit,AfterViewInit {
  constructor(
    public dialogRef: MatDialogRef<ImagePreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  readonly panZoom = viewChild(PanZoomComponent);
  readonly panzoomModel = signal<PanZoomModel>(undefined!);

  currentIndex:any;
  // isZoomed = false;
//  isDragging = false;
  zoomLevel: number = 1; // Initial zoom level
  isDragging: boolean = false; // Dragging state
  startX: number = 0; // Mouse start X
  startY: number = 0; // Mouse start Y
  offsetX: number = 0; // Image offset X
  offsetY: number = 0; // Image offset Y
  tempOffsetX: number = 0; // Temporary offset during drag
  tempOffsetY: number = 0; // Temporary offset during drag
  isZoomed: boolean = false; // Zoom toggle state
  translateX: number = 0;
  translateY: number = 0;
  scale: number = 1;

 
  initialTranslateX = 0;
  initialTranslateY = 0;
  // @ViewChild("img", { static: false }) img!: ElementRef;
  @ViewChild('img') img!: ElementRef;
  @ViewChild('container') 'container': ElementRef;
  // @ViewChild('img') 'img': ElementRef;
  ngOnInit(): void {
    this.currentIndex = this.data?.currentIndex;
  }

  myMethod(): void {
    // API by viewChild
    this.panZoom().zoomIn('lastPoint');
    this.panZoom().centerContent(100)
  }
  

  ngAfterViewInit() {
    // this.centerImage();
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
        const imgElement = this.img.nativeElement;
        imgElement.style.transform = 'scale(1)';
      } else {
        this.currentIndex = this.data.images.data.length - 1; // Wrap around to the last image
      }
    }
  
    nextImage() {
      if (this.currentIndex < this.data.images.data.length - 1) {
        this.currentIndex++;
        const imgElement = this.img.nativeElement;
        imgElement.style.transform = 'scale(1)';
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
    
    // Round off value
    roundOff(value: number): any {
      return Math.round(value);
    }

    toDecimal(value:number){
    return value.toFixed(2);
    }

    //Getting time in Day sessions
    getTimePeriod(datetime: string): string {
      
      const utcDate = dayjs(datetime).utc();
  
      // Get the hour in UTC
      const hours = utcDate.hour();
    
      // Determine the time period based on the UTC hour
      if (hours >= 5 && hours < 11) {
        return "Morning";
      } else if (hours >= 11 && hours < 16) {
        return "Midday";
      } else if (hours >= 16 && hours < 21) {
        return "Evening";
      } else {
        return "Overnight";
      }
    }

    // adjustImageHeight() {
    //   const dialogContainer = document.querySelector('.dialog-content');
    //   const image = document.querySelector('.resizable-image') as HTMLImageElement;
    //   console.log(dialogContainer?.clientHeight,'dialogContainer.clientHeightdialogContainer.clientHeight');
      
    //   if (dialogContainer && image) {
    //     const dialogHeight = dialogContainer.clientHeight;
    //     image.style.height = `${dialogHeight}px`; // Adjust the image height to match the dialog height
    //   }
    // }

     // Handle mouse wheel zoom
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const zoomSpeed = 0.1;
    const delta = event.deltaY < 0 ? 1 : -1;
    this.zoomLevel = Math.max(1, this.zoomLevel + delta * zoomSpeed);
    this.applyTransform();
  }


  // Apply transformations for zoom and drag
  private applyTransform(): void {
    const imgElement = this.img.nativeElement as HTMLImageElement;
    imgElement.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoomLevel})`;
    imgElement.style.cursor = this.zoomLevel > 1 ? "grab" : "grab";
  }

  
//  centerImage() {
//     const containerRect = this.container.nativeElement.getBoundingClientRect();
//     const img = this.img.nativeElement;
//     img.style.width = 300+'px';
//     img.style.height = 400+'px';

//     const containerWidth = containerRect.width;
//     const containerHeight = containerRect.height;

//     const imgWidth = img.naturalWidth;
//     const imgHeight = img.naturalHeight;

//   }

  startPan(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.initialTranslateX = this.translateX;
    this.initialTranslateY = this.translateY;
  }

  doPan(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    this.translateX = this.initialTranslateX + deltaX;
    this.translateY = this.initialTranslateY + deltaY;
  }

  endPan() {
    this.isDragging = false;
  }

  zoomImage(event: WheelEvent) {
    event.preventDefault();
  
    const zoomIntensity = 0.05;
    const delta = event.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    const newScale = this.scale * delta;
    const minScale = 1;
    const maxScale = 10;
  
    if (newScale < minScale || newScale > maxScale) return;
  
    const containerRect = this.container.nativeElement.getBoundingClientRect();
    const img = this.img.nativeElement;
  
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;
  
    // Calculate the center of the image
    const imgCenterX = img.clientWidth * this.scale / 2;
    const imgCenterY = img.clientHeight * this.scale / 2;
  
    // Adjust the translate values to keep the image centered
    this.scale = newScale;
    
    this.translateX = containerCenterX -200 ;
    this.translateY = containerCenterY-150;
  }
  

  get transformStyle() {
    if (this.scale <= 1.4) {
      
      return `translate(365.517px, 260.9985px) scale(1)`;
    }
    return `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  @HostListener('window:mouseup')
  onWindowMouseUp() {
    this.isDragging = false;
  }
}
