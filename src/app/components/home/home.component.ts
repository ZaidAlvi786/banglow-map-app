import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
  inject,
  OnInit,
  OnDestroy,
  Renderer2,
  ChangeDetectorRef,
  HostListener,
  effect,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { SidebarDrawerComponent } from '../sidebar-drawer/sidebar-drawer.component';
import * as L from 'leaflet';
import 'leaflet-draw';
import { SatelliteService } from '../../services/satellite.service';
// import 'leaflet-draw/dist/leaflet.draw.css';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MapCalendarComponent } from '../library/map-calendar/map-calendar.component';
import { SharedService } from '../shared/shared.service';
import { MapControllersPopupComponent } from '../../dailogs/map-controllers-popup/map-controllers-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import dayjs from 'dayjs';
import { NgxUiLoaderModule, NgxUiLoaderService } from 'ngx-ui-loader';
import * as martinez from 'martinez-polygon-clipping';
import interact from 'interactjs';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { WmtsService } from '../../services/wmts.service';
import { WMTSLayer } from '../../services/wmts-layer';
(window as any).type = undefined;

declare module 'leaflet' {
  interface Polygon {
      vendorData: any; // Use specific type instead of 'any' if available
  }
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FooterComponent,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatInput,
    HeaderComponent,
    MatSidenavModule,
    SidebarDrawerComponent,
    MapCalendarComponent,
    MapControllersPopupComponent,
    NgxUiLoaderModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger("slideInOut", [
      state(
        "void",
        style({
          transform: "translateX(100%)",
          opacity: 0,
        })
      ),
      transition(":enter", [
        style({ transform: "translateX(100%)", opacity: 0 }), // Start from right
        animate("0.6s ease-in-out", style({ transform: "translateX(0)", opacity: 1 })), // Slide to center
      ]),
      transition(":leave", [
        animate("0.6s ease-in-out", style({ transform: "translateX(100%)", opacity: 0 })) // Slide out to left
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, AfterViewInit,OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @ViewChild('drawer') drawer?: MatDrawer;
  @ViewChild('draggableContainer') draggableContainer!: ElementRef;
  sidebarWidth: number = 0;
  marginleft:number = 0;
  map!: L.Map;
  zoomLevel: number = 4;
  longitude: number = -90;
  latitude: number = 40;
  parentZoomLevel: number = 4
  drawLayer!: L.FeatureGroup;
  extraShapesLayer!: L.FeatureGroup;
  vectorLayer!: L.LayerGroup;
  shapeLayersData:any[]
  type: string = '';

  private wmtsService =  inject(WmtsService);
  private zoomControlEnabled = false;
  private isDarkMode = true;
  private _snackBar = inject(MatSnackBar);
  private drawHandler: any = null; // Declare drawHandler
  private markerHandler: any;
  private darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20, // Maximum zoom level
    subdomains: 'abc',
  });
  private lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20, // Maximum zoom level
    subdomains: 'abc',
  });
  googleStreets: L.TileLayer = L.tileLayer(
    'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    {
      maxZoom: 20,
      attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }
  )
  googlestreetDarkLayer: L.TileLayer = L.tileLayer(
    'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', // 's' for satellite layer
    {
      maxZoom: 20,
      attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }

);
hybridLayer:L.TileLayer = L.tileLayer(
  'http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  {
    maxZoom: 20,
    attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  }
);


  isGoogleLayerActive: string = 'OpenStreetMapDark'; // Track the current layer
   currentAction: string | null = null; // Tracks the current active action
  private userMarker: L.Marker | null = null; // Store the user marker reference
  private activeDrawTool: L.Draw.Polyline | L.Draw.Polygon | null = null; // Track active drawing tool
  startDate: string ='';
  endDate: string ='';
  data: any;
  @ViewChild(FooterComponent) childComponent!: FooterComponent;
  isDropdownOpen: boolean = false;
  showLayers:boolean = false;
  OpenEventCalendar:boolean=false;
  polygon_wkt:any;
  isDrawerOpen:boolean = false;
  imageOverlay: L.ImageOverlay | undefined;
  imageOverlays: Map<string, L.ImageOverlay> = new Map();
  polygon:any;
  leftMargin:any;
  leftMargin2:any;
  private highlightedPolygon: L.Polygon | null = null;
  calendarApiData:any;
  zoomed_wkt_polygon:any = '';
  shapeType:string = null;
  zoomed_status:boolean = false;
  popUpData:any;
  shapeHoverData:any;
  contextMenu:any
  mapDirection = 1;
  mapFormula = 0;
  vendorData:any = null;
  pointData:any;
  loader: boolean = false;
  filterParams:any;
  isProgrammaticMove = false;
  footPrintActive:boolean = true;
  footprintLoader:boolean = false;
  isCalenderOpen:boolean = false;
  shapeLoader:boolean = false;
  originalPolygon:any = null;
  bbox : any;
  minMap: any;
  maxMap: any;
  constructor(@Inject(PLATFORM_ID) private platformId: Object,
   private satelliteService:SatelliteService,private dialog: MatDialog,
   private http: HttpClient,
   private sharedService:SharedService,
   private el: ElementRef, private renderer: Renderer2,
   private cdr: ChangeDetectorRef,
   private ngxLoader: NgxUiLoaderService,
  )
  {
    this.data = null;
    effect(() => {
      const refreshInfo =  this.sharedService.refreshList()
   console.log(refreshInfo,'refreshInforefreshInforefreshInforefreshInfo');
   
   if(refreshInfo){
       let queryParams ={
        ...this.filterParams,
        page_number: '1',
        page_size: '50',
        start_date:this.startDate,
        end_date: this.endDate
      }
       this.shapeLoader = true;
       this.ngxLoader.startLoader('shapesLoader');
      const payload = {
       wkt_polygon:this.polygon_wkt,
       original_polygon:this.originalPolygon
      }
       this.getDataUsingPolygon(payload,queryParams);
   }
    });
   
  }


  ngOnInit(): void {
    this.setDynamicHeight();
    window.addEventListener('resize', this.setDynamicHeight.bind(this))
    this.sharedService.vendorData$.subscribe((data) => {
      this.vendorData = data;
    });
  }

  ngAfterViewInit(): void {
    // if (isPlatformBrowser(this.platformId)) {
        this.initMap();
        
    // }
    
    
    this.sharedService.isOpenedEventCalendar$.subscribe((state) => {

    if(state){
      if(this.polygon_wkt ){
        const payload = {
          polygon_wkt: this.polygon_wkt,
          start_date: this.startDate,
          end_date: this.endDate,
          original_polygon:this.originalPolygon
        }
        
        // Start the loader
       let queryParams = {}
      
        this.satelliteService.getPolygonCalenderDays(payload,queryParams).subscribe({
          next: (resp) => {
            this.ngxLoader.stop()
            this.calendarApiData = resp.data;
            this.OpenEventCalendar = state
          },
          error: (err) => {
            this.ngxLoader.stop()
            console.error('Error fetching calendar data', err);
            // Hide loader on error
             
          },
          
        });
      // if(state){
      //    const payload = {
      //   polygon_wkt: this.polygon_wkt
      // }
      //   this.satelliteService.getPolygonCalenderDays(payload).subscribe({
      //     next: (resp) => {
      //       console.log(resp,'getPolygonCalenderDaysgetPolygonCalenderDaysgetPolygonCalenderDays');
            
      //     }})
      // }
    }
    } else{
      this.OpenEventCalendar = state
    }
     });
    this.setDynamicHeight();
    window.addEventListener('resize', this.setDynamicHeight.bind(this))
    this.updateSidebarWidth();
    let sidebar = document.getElementById('draggableContainer');
    let mapContainer = document.getElementById('mapContainer');
    // this.leftMargin2
    // setTimeout(() => {
    //   this.marginleft=413
    // }, 3200);
    const sidebarElement = this.draggableContainer.nativeElement;
     interact(sidebarElement)
     .resizable({
      edges: { left: true, right: true, bottom: true, top: false },
      listeners: {
        move:(event)=> {
          // const target = event.target as HTMLElement;
          // target.style.width = `${event.rect.width}px`;
          const target = event.target as HTMLElement;
        
          let minWidth = this.isCalenderOpen ? 730 : 454;

          // Store updated width in the global variable
          if(event.rect.width > minWidth && event.rect.width < 1086){
            this.sidebarWidth = event.rect.width;
            target.style.width = `${this.sidebarWidth}px`;
            
            this.sharedService.isOpenedEventCalendar$.subscribe((state) => {
              this.isCalenderOpen = state;
              if(this.sidebarWidth >= 454 && this.sidebarWidth <= 730 && this.isCalenderOpen){
                target.style.width = this.sidebarWidth + 280 + 'px';
                mapContainer.style.marginLeft = this.sidebarWidth + 280 + 'px';
              }else {
                target.style.width = `${this.sidebarWidth}px`;
                mapContainer.style.marginLeft = `${this.sidebarWidth}px`;
              }
            })
            
            // this.leftMargin2
            
            // this.updateMapMargin();
            // target.style.height = `${event.rect.height}px`;
            target.style.height = `682.575px`;
          }
          // this.applyMargin()
        },
      },
    });
   this.sidebarWidth = sidebarElement.offsetWidth;

    this.sharedService.rightMenuHide$.subscribe((event) =>{
      if(event === false){
          
          if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
          }
       
    }
    })

    this.sharedService.siteMarkerData$.subscribe((event) =>{
      if (event.lat || event.lon) {
        const clickLat = event.lat;
        const clickLng = event.lon;
      
        // Create a marker and add it to the map
        const newMarker = L.marker([clickLat, clickLng], {
          icon: L.icon({
            iconUrl: 'assets/svg-icons/pin-location-icon.svg',
            iconSize: [21, 26],
          }),
        }).addTo(this.map);
      
        // Get current zoom level and update it if needed
        const currentZoom = this.map.getZoom();
        const targetZoom = currentZoom < 6 ? 6 : currentZoom;
      
        // Move the map to the marker's location and set zoom if needed
        this.map.setView([clickLat, clickLng], targetZoom);
      
        // Add click event on marker to fetch API and open the dialog
        newMarker.on('click', () => {
          // Convert lat/lng to screen coordinates
          const mapContainer = this.map.getContainer();
          const markerPoint = this.map.latLngToContainerPoint({ lat: clickLat, lng: clickLng });
      
          // Default dialog position
          let position = {
            top: `${markerPoint.y + mapContainer.offsetTop}px`,
            left: `${markerPoint.x + mapContainer.offsetLeft + 20}px`,
          };
      
          // Fetch API when clicking on the marker
          const { normalizedLatitude, normalizedLongitude } = this.getlatlngNormalized(clickLat, clickLng);
          const payload = {
            latitude: normalizedLatitude,
            longitude: normalizedLongitude,
            distance: 1,
            site_id: event.id
          };
      
          this.satelliteService.getPinSelectionAnalytics(payload).subscribe({
            next: (resp) => {
              if (resp) {
                const markerData = resp?.data?.analytics;
      
                this.getAddress(clickLat, clickLng).then((address) => {
                  const dialogRef = this.dialog.open(MapControllersPopupComponent, {
                    width: '357px',
                    data: { type: 'marker', markerData, pointData: payload, status: 'view' },
                    position,
                    panelClass: 'custom-dialog-class',
                  });
      
                  // After dialog opens, measure and adjust position
                  dialogRef.afterOpened().subscribe(() => {
                    const dialogElement = document.querySelector('.custom-dialog-class') as HTMLElement;
                    if (dialogElement) {
                      const dialogHeight = dialogElement.offsetHeight;
                      const mapHeight = mapContainer.offsetHeight;
                      const mapWidth = mapContainer.offsetWidth;
      
                      // Adjust horizontal position (left or right)
                      let newLeft = markerPoint.x + mapContainer.offsetLeft + 20;
                      if (markerPoint.x + 300 > mapWidth) {
                        newLeft = markerPoint.x + mapContainer.offsetLeft - 300 - 20; // Move to the left
                      }
      
                      // Adjust vertical position (top or bottom)
                      let newTop: number;
                      const spaceAboveMarker = markerPoint.y;
                      const spaceBelowMarker = mapHeight - markerPoint.y;
      
                      if (spaceBelowMarker >= dialogHeight + 20) {
                        newTop = markerPoint.y + mapContainer.offsetTop + 10;
                      } else if (spaceAboveMarker >= dialogHeight + 20) {
                        newTop = markerPoint.y + mapContainer.offsetTop - dialogHeight - 10;
                      } else {
                        newTop = Math.max(
                          mapContainer.offsetTop,
                          Math.min(markerPoint.y + mapContainer.offsetTop - dialogHeight / 2, mapHeight - dialogHeight)
                        );
                      }
      
                      // Update dialog position dynamically
                      dialogRef.updatePosition({
                        top: `${newTop + 10}px`,
                        left: newLeft > 1300 ? `${newLeft - 400}px` : `${newLeft}px`,
                      });
                    }
                  });
      
                  dialogRef.afterClosed().subscribe(() => {
                  
                    this.sharedService.setSiteMarkerData(null);
                  });
                });
              }
            },
            error: (err) => {
              console.log("err getPolyGonData: ", err);
            },
          });
        });
      }
      
    })
  }

  applyMargin() {
    const contentElement = document.getElementById('mapContainer');
    if (contentElement) {
      contentElement.style.marginLeft = `${this.sidebarWidth}px`;
    }
  }

  updateSidebarWidth(): void {
    
    // this.sidebarWidth=820;
    // this.applyMargin()
    
    const container = this.draggableContainer?.nativeElement as HTMLElement;
    const sidebar = document.getElementById('draggableContainer');
    const dragBtn = document.getElementById('dragBtn');
    const mapContainer = document.getElementById('mapContainer');
    if (this.isDrawerOpen) {
      if(sidebar.style.width!='0px'){
        this.sidebarWidth=this.sidebarWidth+1
        setTimeout(() => {
          this.sidebarWidth=this.sidebarWidth
          
          
        }, 1000);
      }else{
        setTimeout(() => {
          this.sidebarWidth=820
          // this.marginleft = 413

        }, 1000);
      dragBtn.style.display='block'
        sidebar.style.width = '820px'; // Default sidebar width
        sidebar.style.height = '682.575px';
        mapContainer.style.marginLeft = '820px'
        // this.applyMargin()
        // Default sidebar width
      }
    } else {
      sidebar.style.width = '0px'; // Hide the sidebar
      dragBtn.style.display='none'
    }
  }

  //openstreetmap search and location markers function
  onSearchLocation(result: google.maps.places.PlaceResult) {
    // Remove existing markers from the map
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });
  
    // Get the latitude and longitude of the searched location
    const lat = result.geometry?.location?.lat()!;
    const lng = result.geometry?.location?.lng()!;
  
    // Move the map to the searched location
    this.map.setView([lat, lng], this.zoomLevel);
  
    // Define the custom marker icon
    const markerIcon = L.icon({
      iconUrl: 'assets/svg-icons/pin-location-icon.svg',  // Adjust the path if necessary
      iconSize: [25, 41],  // Adjust the icon size
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  
    // Add a marker to the map without auto-opening the popup
    const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(this.map);
    const markerId = `marker-${Date.now()}`;
    // Bind the popup to the marker but do not open it automatically
    marker.bindPopup(`<b>Location:</b> ${result.formatted_address}
      <span id="${markerId}" style="height:20px;width:20px;display:block;cursor: pointer;
      position: absolute;
      top: 20px;
      right: 2px;>
      <?xml version="1.0" encoding="utf-8"?>
      <!-- License: CC Attribution. Made by salesforce: https://lightningdesignsystem.com/ -->
      <svg fill="#191E22" xmlns="http://www.w3.org/2000/svg" 
        width="20px" height="20px" viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve">
      <g>
        <path d="M45.5,10H33V6c0-2.2-1.8-4-4-4h-6c-2.2,0-4,1.8-4,4v4H6.5C5.7,10,5,10.7,5,11.5v3C5,15.3,5.7,16,6.5,16h39
          c0.8,0,1.5-0.7,1.5-1.5v-3C47,10.7,46.3,10,45.5,10z M23,7c0-0.6,0.4-1,1-1h4c0.6,0,1,0.4,1,1v3h-6V7z"/>
        <path d="M41.5,20h-31C9.7,20,9,20.7,9,21.5V45c0,2.8,2.2,5,5,5h24c2.8,0,5-2.2,5-5V21.5C43,20.7,42.3,20,41.5,20z
          M23,42c0,0.6-0.4,1-1,1h-2c-0.6,0-1-0.4-1-1V28c0-0.6,0.4-1,1-1h2c0.6,0,1,0.4,1,1V42z M33,42c0,0.6-0.4,1-1,1h-2
          c-0.6,0-1-0.4-1-1V28c0-0.6,0.4-1,1-1h2c0.6,0,1,0.4,1,1V42z"/>
      </g>
      </svg></span>`)

      marker.on('popupopen', () => {
        const btn = document.getElementById(markerId);
        console.log(btn,'btnbtnbtnbtnbtn');
        
        if (btn) {
          btn.addEventListener('click', () => {
            this.map.removeLayer(marker); // Remove marker from map
          });
        }
      });
      setTimeout(() => {
        marker.openPopup();
      }, 0);
  }
  

  //openstreetmap initialization
  private initMap(): void {
    // Initialize the map
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [22.5, 112.5], // Initial center
      zoom: this.zoomLevel,
      zoomControl: false,
      minZoom: 4, // Minimum zoom level
      maxZoom: 20, // Maximum zoom level
      scrollWheelZoom: true, // Enable zooming via scroll wheel
      dragging: true, // Enable dragging
      // worldCopyJump: true, // Allow world wrapping
    });
  
    // Add Tile Layer (Dark mode basemap)
    this.darkLayer.addTo(this.map);
  
    // Initialize the drawing layer
    this.drawLayer = new L.FeatureGroup();
    this.extraShapesLayer = L.featureGroup().addTo(this.map);
    this.map.addLayer(this.drawLayer);
  
    // Initialize and add the vector layer
    this.vectorLayer = L.layerGroup();
    this.vectorLayer.addTo(this.map);
  
    // Define the polygon coordinates
    const polygonCoordinates: L.LatLngExpression[] = [
      [10, 90],   // [latitude, longitude]
      [10, 135],
      [50, 135],
      [50, 90],
      [10, 90],   // Close the polygon
    ];
  
    // Add the polygon to the map
    this.polygon = L.polygon(polygonCoordinates, {
      color: 'rgba(102, 204, 102, 0.8)', // Border color
      fillColor: 'rgba(102, 204, 102, 0.1)', // Fill color with opacity
      weight: 3, // Border thickness,
      dashArray: '10, 10'
      
    }).addTo(this.map);
  
    // Calculate the bounds of the polygon
    const polygonBounds = this.polygon.getBounds();
  
    // Get the center of the polygon
    const polygonCenter = polygonBounds.getCenter();
  
    // Adjust the map view to fit the polygon with proper padding
    this.map.fitBounds(polygonBounds, {
      padding: [200, 200], // Sufficient padding to show borders
    });
  
    // Move the map center to the center of the polygon
    this.map.setView(polygonCenter, this.map.getZoom(), { animate: true });
  
    // Debugging: Log GeoJSON and bounds of the polygon
    const geoJSON = this.polygon.toGeoJSON();
    const orginalCords = this.latLngBoundsToPolygon(polygonBounds)
    // Pass the GeoJSON and bounds to your custom function
    this.getPolygonFromCoordinates({ geometry: geoJSON.geometry }, orginalCords,true);
  
    // Add zoom change listener
    // this.map.on('zoomend', () => {
    //   this.zoomLevel = this.map.getZoom();
    //   if (this.map.getZoom() < 4) {
    //     this.map.setZoom(4); // Prevent zooming out below the minimum level
    //   }
    //   if (this.polygon) {
    //     // Get the bounds of the drawn shape
    //      // Get the bounds of the drawn shape
    //      const bounds = this.polygon.getBounds();

    //      // Construct WKT manually for the bounds
    //      const wkt = this.boundsToWKT(bounds);
 
    //      // Log the WKT string of the zoomed polygon
    // }
    // });

    // Add right-click event listener
    this.map.on('contextmenu', (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;

      const {normalizedLatitude, normalizedLongitude} =  this.getlatlngNormalized(lat, lng)
      const coords = `${normalizedLatitude.toFixed(4)}, ${normalizedLongitude.toFixed(4)}`;
          
      // Create a context menu if it doesn't exist
       this.contextMenu = document.getElementById('context-menu');
      if (!this.contextMenu) {
        
        this.contextMenu = document.createElement('div');
        this.contextMenu.id = 'context-menu';
        this.contextMenu.style.position = 'absolute';
        this.contextMenu.style.zIndex = '1000';
        this.contextMenu.style.backgroundColor = '#20272D';
        this.contextMenu.style.border = '1px solid #20272D';
        this.contextMenu.style.padding = '5px';
        this.contextMenu.style.boxShadow = '0px 2px 1px 0px rgba(0, 0, 0, 0.50)';
        this.contextMenu.style.cursor = 'pointer';
        document.body.appendChild(this.contextMenu);
    
        // Add menu option
        const menuOption = document.createElement('div');
        menuOption.textContent = 'Copy Coordinates';
        menuOption.style.padding = '5px';
        menuOption.style.whiteSpace = 'nowrap';
        menuOption.style.fontSize = '14px';
        menuOption.style.color = '#ABB7C0'
    
        menuOption.addEventListener('click', () => {
          try {
            navigator.clipboard.writeText(coords).then(() => {
              this._snackBar.open('Latitude and Longitude copied to clipboard!', 'Ok', {
                duration: 2000,
              });
            }).catch((err) => {
              console.error('Clipboard API failed. Falling back to execCommand:', err);
              this.fallbackCopyToClipboard(coords);
            });
          } catch(e) {
            console.error('Clipboard API failed. Falling back to execCommand:', e);
            this.fallbackCopyToClipboard(coords);
          }

    
          // Hide the context menu
          this.contextMenu.style.display = 'none';
          this.contextMenu.removeChild(menuOption);
          document.body.removeChild(this.contextMenu);
          this.contextMenu = null;
        });
    
        this.contextMenu.appendChild(menuOption);
      }
    
      // Position and show the context menu
      this.contextMenu.style.left = `${event.originalEvent.pageX}px`;
      this.contextMenu.style.top = `${event.originalEvent.pageY}px`;
      this.contextMenu.style.display = 'block';
    
      // Hide the menu on any other click
      this.map.once('click', () => {
        this.contextMenu.style.display = 'none';
      });
    });
    
  
    // Add mousemove event to track coordinates
    this.map.on('mousemove', (event: L.LeafletMouseEvent) => {
      const coords = event.latlng;

      // Clamp latitude to [-90, 90] and longitude to [-180, 180]
      const clampedLat = Math.max(-90, Math.min(90, coords.lat));
      const clampedLng = ((coords.lng + 180) % 360 + 360) % 360 - 180; // Wrap longitude to [-180, 180]
    
      this.longitude = parseFloat(clampedLng.toFixed(4));
      this.latitude = parseFloat(clampedLat.toFixed(4));
    });
  
    // Adjust view to clamp latitude if necessary
    this.map.on('move', (event: L.LeafletMouseEvent) => {
      const coords = event.latlng;

      const mapSize = this.map.getSize(); // Get the map viewport size
      // const mapViewportWidth = mapSize.x; // Extract the width
      
      const center = this.map.getCenter();
      const lat = Math.max(-90, Math.min(90, center.lat));
      const lng = center.lng; // Allow longitude wrapping
      if (lat !== center.lat) {        
        this.map.setView([lat, lng], this.map.getZoom(), { animate: false });
      }
    });
  
    // Add click event listener
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      // Custom click functionality can go here
    });
  

    // Add event listener for when a shape is created
    this.map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      this.drawLayer.addLayer(layer);
  
      // Calculate bounds for the newly created shape
      const bounds = layer.getBounds();
  
      // Fit the map to the bounds of the new shape
     
      
      
      
  
      // Debugging: Log GeoJSON of the created feature
      const geoJSON = layer.toGeoJSON();
    });
    this.map.on('zoomend', () => {
      this.zoomLevel = this.map.getZoom();
      if (this.map.getZoom() < 4) {
        this.map.setZoom(4); // Prevent zooming out below the minimum level
      }
      
        // Get the bounds of the drawn shape
         // Get the bounds of the drawn shape
       
          this.layercalculateVisibleWKT();
        
        
    
    });

    this.map.on('dragend', () => {

      
        // Get the bounds of the drawn shape
         // Get the bounds of the drawn shape
        
          this.layercalculateVisibleWKT();
        
    
    });
  
    // Re-fit bounds on window resize to maintain visibility of shapes
    // window.addEventListener('resize', () => {
    //   if (this.drawLayer.getBounds) {
    //     const bounds = this.drawLayer.getBounds();
    //     this.map.fitBounds(bounds, {
    //       padding: [200, 200],
    //     });
  
    //     // Center the map on the shape after resizing
    //     const center = bounds.getCenter();
    //     this.map.setView(center, this.map.getZoom(), { animate: true });
    //   }
    // });
  
    // Geolocation support
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          // this.map.setView([lat, lng], 8, { animate: true });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  
    // Ensure no redundant listeners are left
    this.map.off('add');
    this.map.off('click');
  }

  // Fallback method to copy text
private fallbackCopyToClipboard(text: string): void {
  // Create a temporary textarea element
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed'; // Prevent scrolling to the textarea
  textarea.style.opacity = '0'; // Make it invisible
  document.body.appendChild(textarea);

  // Select and copy the text
  textarea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      this._snackBar.open("Latitude and Longitude copied to clipboard!", "Ok", {
        duration: 2000, // Snackbar will disappear after 300 milliseconds
      });
    } else {
      console.error('Fallback copy failed');
    }
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }

  // Clean up the textarea element
  document.body.removeChild(textarea);
}
  
  
  private adjustMapCenter(containerWidth: number): void {
    // Adjust the center based on the width
    const adjustedLongitude = containerWidth / 100; // Example calculation, tweak as needed
    const adjustedCenter: L.LatLngExpression = [22.5, 112.5 + adjustedLongitude];
   
    this.map.setView(adjustedCenter, this.zoomLevel);

  }

  // private addPin(coords: [number, number], iconUrl: string): void {
  //   const customIcon = L.icon({
  //     iconUrl,
  //     iconSize: [25, 41],
  //     iconAnchor: [12, 41],
  //   });

  //   L.marker(coords, { icon: customIcon }).addTo(this.map);
  // }

  // private addPin(coords: [number, number], iconUrl: string): void {
  //   const customIcon = L.icon({
  //     iconUrl,
  //     iconSize: [25, 41],
  //     iconAnchor: [12, 41],
  //   });

  //   L.marker(coords, { icon: customIcon }).addTo(this.map);
  // }

  //map zoom in function
  zoomIn(): void {
    const currentZoom = this.map.getZoom();
    if (currentZoom < this.map.getMaxZoom()) {
      this.map.setZoom(currentZoom + 1);
    }
  }

  //map zoom out function
  zoomOut(): void {
    const currentZoom = this.map.getZoom();
    if (currentZoom > this.map.getMinZoom()) {
      this.map.setZoom(currentZoom - 1);
    }
  }

  //Map zoom level setting through slider
  onZoomLevelChange(newZoomLevel: number): void {
    this.parentZoomLevel = newZoomLevel;
    this.map.setZoom(this.parentZoomLevel);
    if (this.drawLayer) {
      // Get the bounds of the drawn shape
      const bounds = this.drawLayer.getBounds();
      
      // Log the coordinates of the zoomed area (bounds)
      
      // Optionally, log the north-east and south-west coordinates
  }
  }

  //angular drawer toggle function
  toggleDrawer(): void {
    if (this.drawer && this.type) {
      
      this.drawer.toggle();
      this.handleDropdownToggle(this.isDrawerOpen)
      this.drawer._animationState = 'open';
        const mapContainer = this.mapContainer.nativeElement;
        // mapContainer.style.marginLeft = this.leftMargin >820 ? '820px': `${this.leftMargin}px`;
        // mapContainer.style.marginLeft = '420px'
      
    } else {
      this.drawer._animationState = 'void';
      this.isDrawerOpen = false;
      const mapContainer = this.mapContainer.nativeElement;
      mapContainer.style.marginLeft = `0px`;
      this.sharedService.setIsOpenedEventCalendar(false);
    }
    this.onResize()
  }
  closeDrawer(){
    this.drawer._animationState = 'void';
      this.isDrawerOpen = false;
      const mapContainer = this.mapContainer.nativeElement;
      mapContainer.style.marginLeft = `0px`;
      this.sharedService.setIsOpenedEventCalendar(false);
      this.onResize()
      this.closeSideBar()
  }

  //map shape drawing function
  setDrawType(type: any): void {
    this.currentAction = null;
   this.shapeType = type
   this.sharedService.setOverlayShapeData(null)
    // Remove existing shapes and event listeners
    if (this.polygon) {
        this.map.off('layeradd');
        this.map.removeLayer(this.polygon);
        this.map.off('click');
        this.drawLayer.clearLayers();
        this.clearExtraShapes();
    }

    // Remove any existing drawing events
    this.map.off(L.Draw.Event.CREATED);
    this.map.off('draw:drawstart'); // Remove tooltip for drawing
    this.map.off('draw:drawstop');

    // Disable any active draw handler
    if (this.drawHandler) {
        this.drawHandler.disable();
    }

    // Clear existing layers
    if (this.drawLayer) {
        this.drawLayer.clearLayers();
        this.clearExtraShapes();
    }

    // Define options for the specific shape type
    let drawHandler: any;

    if (type === 'Polygon') {
        drawHandler = new L.Draw.Polygon(this.map as L.DrawMap, {
            showArea: true,
            shapeOptions: {
                color: '#ff6666',
                fillColor: 'rgba(102, 204, 102, 0.1)',
                weight:3,
                dashArray: '10, 10',
            },
        });
    } else if (type === 'Circle') {
        drawHandler = new L.Draw.Circle(this.map as L.DrawMap, {
            shapeOptions: {
                color: '#3399ff',
                fillColor: 'rgba(102, 204, 102, 0.1)',
                weight:1
            },
        });
    } else if (type === 'Box') {
        drawHandler = new L.Draw.Rectangle(this.map as L.DrawMap, {
            shapeOptions: {
                color: '#66cc66',
                fillColor: 'rgba(102, 204, 102, 0.1)',
                weight:3,
                dashArray: '10, 10'
            },
        });
    }

    if (drawHandler) {
        // Start the drawing process immediately
        this.isProgrammaticMove = true;  // Set the flag before programmatic move
        drawHandler.enable();
        this.drawHandler = drawHandler; // Store the handler for later use
        // Add an event listener for when the shape is created
        this.map.on(L.Draw.Event.CREATED, (event: any) => {
            const layer = event.layer; // The drawn layer
            this.drawLayer.addLayer(layer); // Add to the feature group


            if (event.layerType === 'polygon' && type === 'Polygon') {
              const bounds = (layer as L.Polygon).getBounds();
              const geoJSON = layer.toGeoJSON();
              //  this.zoomed_wkt_polygon = ''
              //  this.closeDrawer()
              this.sharedService.setDrawShape(true);
              this.sharedService.shapeDrawStatus.set(true)
               this.removeAllImageOverlays();
               const orginalCords = this.latLngBoundsToPolygon(bounds)
              this.getPolygonFromCoordinates({ geometry: geoJSON?.geometry }, orginalCords);
             
              setTimeout(() => {
                 this.sharedService.setDrawShape(false)
                this.map.fitBounds(bounds, {
                    padding: [50, 50], // Adds padding around the bounds
                    maxZoom: 20        // Caps the zoom level
                });
            }, 500);
            setTimeout(() => {
              this.isProgrammaticMove = false;
            }, 600); // Adjust the delay as needed            
             
             
          } else if (event.layerType === 'circle' && type === 'Circle') {
              const bounds = (layer as L.Circle).getBounds();
              const geoJSON = layer.toGeoJSON();
               
              //  this.closeDrawer()
              this.sharedService.setDrawShape(true);
              this.drawer.toggle();
              this.handleDropdownToggle(this.isDrawerOpen)
              this.drawer._animationState = 'open';
               this.removeAllImageOverlays()
               const orginalCords = this.latLngBoundsToPolygon(bounds);
               
              this.getPolygonFromCoordinates({ geometry: geoJSON?.geometry }, orginalCords);
              setTimeout(() => {
                this.sharedService.shapeDrawStatus.set(true)
                this.sharedService.setDrawShape(false)
                this.map.fitBounds(bounds, {
                    padding: [10, 10], // Adds padding around the bounds
                    maxZoom: 20       // Caps the zoom level
                });
            }, 500);            
             
          } else if (event.layerType === 'rectangle' && type === 'Box') {
              const bounds = (layer as L.Rectangle).getBounds();
              const geoJSON = layer.toGeoJSON();
              //  this.zoomed_wkt_polygon = ''
              //  this.closeDrawer()
              this.sharedService.setDrawShape(true);
              this.drawer.toggle();
              this.handleDropdownToggle(this.isDrawerOpen)
              this.drawer._animationState = 'open';
               this.removeAllImageOverlays();
               this.sharedService.shapeDrawStatus.set(true)
               const orginalCords = this.latLngBoundsToPolygon(bounds)
               
              this.getPolygonFromCoordinates({ geometry: geoJSON?.geometry }, orginalCords);
             
              setTimeout(() => {
                this.sharedService.setDrawShape(false)
                
                this.map.fitBounds(bounds, {
                    padding: [50, 50], // Adds padding around the bounds
                    maxZoom: 16        // Caps the zoom level
                });
            }, 500);
            setTimeout(() => {
              this.isProgrammaticMove = false;
            }, 600);             
              
          }

            // Disable the draw handler after the shape is created
            drawHandler.disable();
            this.map.off(L.Draw.Event.CREATED); // Remove the event listener
            type = null;

        });
        
         this.map.on('zoomend', () => {
          this.zoomLevel = this.map.getZoom();
          if (this.map.getZoom() < 4) {
            this.map.setZoom(4); // Prevent zooming out below the minimum level
          }
          
            
              this.layercalculateVisibleWKT();
            
            
        
        });
    
        this.map.on('dragend', () => {
          if (!this.isProgrammaticMove) {
            // Only call API if the movement is user-triggered
            this.layercalculateVisibleWKT();
          }
            
        
        });

        // Add event listener to remove tooltip when drawing starts/stops
        this.map.on('draw:drawstart', () => {
        });
        this.map.on('draw:drawstop', () => {
        });
    } else {
        console.error("Invalid draw type specified.");
    }
}

  //Getting the polygon from cordinates functionality
  getPolygonFromCoordinates(payload:{geometry:{type:string,coordinates:any[]}},bound:any,  isLoadFirstTime = false) {
    if(this.map) {
      this.map.setZoom(4)
    }
    const  updatedPayload = this.normalizePayloadCoordinates(payload);
    const customPayload = {
      geometry:bound,
    }
    this.satelliteService.getPolyGonData(customPayload).subscribe({
      next: (resp) => {
        this.originalPolygon = resp?.data?.wkt_polygon;
      },
      error: (err) => {
        console.log(err);
      }
    })
    this.satelliteService.getPolyGonData(updatedPayload).subscribe({
      next: (resp) => {
        this.polygon_wkt = resp?.data?.wkt_polygon;
        if (isLoadFirstTime) {
          console.log('wwwwwwwwwwwwwww');
          
          this.zoomed_wkt_polygon = this.polygon_wkt;
        }
        // if(resp?.data?.area>=100000000){
        //   this.openSnackbar("Select a smaller polygon");
          
          
        // }else {
          if (this.startDate === '' && this.endDate === '') {
            // Start of the previous day
            this.startDate = dayjs().utc().subtract(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');
                        
            // End of the previous day
            this.endDate = dayjs().utc().endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');
            
          }
          let queryParams ={
            ...this.filterParams,
            page_number: '1',
            page_size: '50',
            start_date:this.startDate,
            end_date: this.endDate
          }
          this.data = resp?.data;
          this.shapeLoader = true;
          this.ngxLoader.startLoader('shapesLoader');
         const payload = {
          wkt_polygon:this.polygon_wkt,
          original_polygon:this.originalPolygon
         }
          this.getDataUsingPolygon(payload,queryParams);
      },
      error: (err) => {
        console.log("err: ", err);
      },
    });
  }


getMapNumber(lon) {
    return Math.floor((lon + 180) / 360) + 1;
}

  //Get original coordinates function
  latLngBoundsToPolygon(bounds) {
    const { _southWest, _northEast } = bounds;

    const coordinates = [
        [_northEast.lng, _southWest.lat], // Bottom-right
        [_northEast.lng, _northEast.lat], // Top-right
        [_southWest.lng, _northEast.lat], // Top-left
        [_southWest.lng, _southWest.lat], // Bottom-left
        [_northEast.lng, _southWest.lat]  // Closing the polygon
    ];

    return {
        type: "Polygon",
        coordinates: [coordinates]
    };
  }
  
  normalizePayloadCoordinates(payload: any): any {
    if (payload.geometry && Array.isArray(payload.geometry.coordinates)) {
      payload.geometry.coordinates = payload.geometry.coordinates.map(coordinateSet =>
        coordinateSet.map(([longitude, latitude]: [number, number]) => {

         const {normalizedLatitude, normalizedLongitude} =  this.getlatlngNormalized(latitude, longitude)
          let direction =  1;
        if (longitude >=0) {
          direction = 1;       
        } else {      
          direction= -1;  
        }
        
       this.mapFormula = (360*(Math.floor((Math.floor((longitude + 180)  / 360)+1) -1)))
      return [normalizedLongitude, normalizedLatitude];
        })
      );
    }
    // let crossesDateline = false;
    // for (let i = 1; i < payload.geometry.coordinates.length; i++) {
    //   if (Math.abs(payload.geometry.coordinates[i].lng - payload.geometry.coordinates[i - 1].lng) > 180) {
    //     crossesDateline = true;
    //     break;
    //   }
    // }

    // console.log("crossesDatelinecrossesDateline", crossesDateline);
    
    // // If it does not cross the dateline, return normalized coordinates.
    // if (!crossesDateline) {
    //   return payload;
    // }

    // payload.geometry.coordinates=  payload.geometry.coordinates.map(coordinateSet => 
    //   coordinateSet.map(([longitude, latitude]: [number, number]) => {
    //     let lng = longitude;
    //     if (lng < 0) {
    //       lng += 360;
    //     }
    //     return { lat: latitude, lng };

    //   })

    // );
  
    return payload; // Return the updated payload
  }

  normalizePayloadZoomCoordinates(coordinates: any): any {
    if (coordinates && Array.isArray(coordinates)) {
       coordinates = coordinates.map(coordinateSet =>
        coordinateSet.map(([longitude, latitude]: [number, number]) => {

         const {normalizedLatitude, normalizedLongitude} =  this.getlatlngNormalized(latitude, longitude)
        //   let direction =  1;
        // if (normalizedLongitude >=0) {
        //   direction = 1;       
        // } else {      
        //   direction= -1;  
        // }
        
      //  this.mapFormula = (360*(Math.floor((Math.floor((longitude + 180)  / 360)+1) -1)) * direction)
      return [normalizedLongitude, normalizedLatitude];
        })
      );
    }
    return coordinates; // Return the updated payload
  }
  //Polygon data getting by using polygon fucntionality
  getDataUsingPolygon(payload: any, queryParams: any) {
    this.satelliteService.getDataFromPolygon(payload, queryParams).subscribe({
      next: (resp) => {
        this.shapeLayersData = resp.data
        this.extraShapesLayer?.clearLayers();
        if (Array.isArray(resp?.data)&& this.footPrintActive) {
          this.bbox = this.getBoundingBox(this.map);
          this.minMap = this.getMapNumber(this.bbox.minLon);
          this.maxMap = this.getMapNumber(this.bbox.maxLon);
          
          
          resp.data.forEach((item: any) => {
            this.addPolygonWithMetadata(item);
          });
          if(!this.isDrawerOpen){
            this.isDrawerOpen = true
            this.updateSidebarWidth();

             this.type = 'library'
            this.toggleDrawer();
            setTimeout(()=>{
              this.sharedService.shapeType.set(this.shapeType)
            },300)
            
            

  // Find the .leaflet-interactive element
  
            // this.type === 'library'? this.parentZoomLevel = 5: this.parentZoomLevel=4;
            // this.onZoomLevelChange(this.parentZoomLevel)
          } else if (this.type === 'library'){
          
            // this.zoomed_wkt_polygon = ''
          this.isDrawerOpen = true
          this.drawer._animationState = 'open'
          this.type = 'library'
           this.toggleDrawer()
           this.cdr.detectChanges();
          }
  
          // Adjust map zoom to keep all drawn shapes visible
          setTimeout(() => {
            if (this.drawer?._animationState === 'open') {
              const bounds = this.extraShapesLayer.getBounds();
              if (bounds.isValid()) {
                this.map.fitBounds(bounds, {
                  padding: [50, 50], // Adjust padding for better visibility
                  animate: true,
                });
              }
            }
          }, 600);
        }
        this.shapeLoader = false;
        this.ngxLoader.startLoader('shapesLoader');
      },
      error: (err) => {
        console.log('Error in getDataUsingPolygon:', err);
      },
    });
  }
  // Function to add the polygon and its metadata
  private addPolygonWithMetadata(data: any): void {
    
  
    // For each coordinate in the polygon, adjust the longitude based on viewport
    // Here we generate a dynamic set of polygons if necessary so that they appear in the viewport.
    // In this example, we assume the polygon should be shifted if its corrected coordinates fall within the bounding box.
    const dynamicPolygons: L.LatLngExpression[][] = [];

    const originalCoordinates  = data.coordinates_record.coordinates[0]; // Access the first array of coordinates
  // if (this.minMap == 0) {
  //   this.minMap = 1;
  //   this.maxMap = 2;
  // }
    // Convert [lng, lat] to [lat, lng] (Leaflet requires [lat, lng] format)
   for (let mapNum = this.minMap; mapNum <= this.maxMap; mapNum++) {
    // Adjust each coordinate in the polygon.
    const adjustedLatLngs = originalCoordinates.map((coord: [number, number]) => {
      // Convert [lng, lat] to [lat, lng] and adjust longitude using mapFormula and mapNum offset.
      return [
        coord[1],
        // coord[0] + this.mapFormula + (mapNum - 1) * 360,
        coord[0] + (mapNum - 1) * 360 ,
      ];
    });
    // Check if at least one adjusted coordinate is within the bounding box.
    const visible = adjustedLatLngs.some(([lat, lng]) =>
      lng >= this.bbox.minLon && lng <= this.bbox.maxLon &&
      lat >= this.bbox.minLat && lat <= this.bbox.maxLat
    );
    if (visible) {
      dynamicPolygons.push(adjustedLatLngs);
    }
  }
  
    let color = 'rgba(239, 242, 77, 0.8)'; // Default color with 50% opacity
    let fillColor = 'rgba(239, 242, 77, 0.1)';
if (data.vendor_name === 'planet') {
    color = 'rgba(85, 255, 0, 0.8)'; // Green with 50% opacity
    fillColor = 'rgba(85, 255, 0, 0.1)';
} else if (data.vendor_name === 'blacksky') {
    color = 'rgba(255, 255, 0, 0.8)'; // Yellow with 50% opacity
    fillColor = 'rgba(85, 255, 0, 0.1)';
} else if (data.vendor_name === 'maxar') {
    color = 'rgba(255, 170, 0, 0.8)'; // Orange with 50% opacity
    fillColor = 'rgba(255, 170, 0, 0.1)';
} else if (data.vendor_name === 'airbus') {
    color = 'rgba(0, 112, 255, 0.8)'; // Blue with 50% opacity
    fillColor = 'rgba(0, 112, 255, 0.1)';
} else if (data.vendor_name === 'skyfi') {
    color = 'rgba(169, 0, 230, 0.8)'; // Purple with 50% opacity
    fillColor = 'rgba(169, 0, 230, 0.1)'; 
} else {
    color = 'rgba(255, 0, 197, 0.8)'; // Pink with 50% opacity
    fillColor = 'rgba(255, 0, 197, 0.1)';
}

    
  
    // Add the polygon to the map
   // When creating the polygon
   dynamicPolygons.forEach(latLngs => {
const polygon = L.polygon(latLngs, {
  color: color,
  fillColor: fillColor,
  fillOpacity: 0,
  opacity:0.5,
  weight: 0.5
}) as L.Polygon & { vendorData: any };

polygon.vendorData = data; // Now TypeScript knows about this property

// In your click handler
 // Attach hover events to the polygon
 polygon.on('mouseover', (e) => this.onPolygonHover(data.vendor_id));
 polygon.on('mouseout', (e) => this.onPolygonOut(null));

polygon.on('click', (event: L.LeafletMouseEvent) => {
  if (this.currentAction === 'location') return;

  const clickedPoint = event.latlng;
  const clickedVendorData = [];

  this.extraShapesLayer.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Polygon) {
          const polygonLayer = layer as L.Polygon & { vendorData: any };
          if (polygonLayer.getBounds().contains(clickedPoint)) {
              clickedVendorData.push(polygonLayer.vendorData);
          }
      }
  });
  if(clickedVendorData.length>1)this.sharedService.setOverlayShapeData(clickedVendorData);
  
  const vendorIds = clickedVendorData.map(v => v.vendor_id);
      const clickedPolygon = polygon; // The polygon that was clicked
      const clickedLatLngs = clickedPolygon.getLatLngs()[0] as L.LatLng[]; // Get the coordinates of the clicked polygon
  
      // Calculate the bounding box of the clicked polygon
      const clickedBoundingBox = this.getBoundingBox(clickedLatLngs);
  
      const intersectingPolygons: any[] = []; // To store all polygons within range
  
      // Iterate through all polygons in the `extraShapesLayer`
      this.extraShapesLayer.eachLayer((layer) => {
          if (layer instanceof L.Polygon) {
              const layerLatLngs = layer.getLatLngs()[0] as L.LatLng[]; // Get the coordinates of this polygon
              const layerBoundingBox = this.getBoundingBox(layerLatLngs) as any; // Get its bounding box
              // Check if the bounding boxes intersect
              if (this.isBoundingBoxIntersecting(clickedBoundingBox, layerBoundingBox)) {
                  const polygonData = (layer as any).options.data; // Assuming metadata is stored in options.data
                  if (polygonData) {
                      intersectingPolygons.push(polygonData); // Add matching polygon's data
                  }
              }
          }
      });
      // Fetch data for all intersecting polygons
      let queryParams = {
        page_number: '1',
        page_size: '50',
        start_date: '',
        end_date: '',
        vendor_id: data.vendor_id,
        source:  'library',
        enableLoader: 'enableLoader'
    };
    this.satelliteService.getDataFromPolygon('', queryParams).subscribe({
        next: (resp) => {
            const vendorData = resp.data[0];
            this.vendorData = resp.data[0];
            this.sharedService.setRowHover(data?.vendor_id)
            this.sharedService.setVendorData(this.vendorData)
            this.onPolygonOut(null)
            // this.openDialogAtPosition(polygon, vendorData);
            //Library table checbox check data
            // this.popUpData = vendorData

        },
        error: (err) => {
            console.error("Error fetching polygon data: ", err);
        },
    });
    
});
// Add the polygon to the extra shapes layer
    this.extraShapesLayer?.addLayer(polygon);
});
  
  
    
  
    // Explicitly disable the draw handler
    if (this.drawHandler && this.drawHandler._toolbars && this.drawHandler._toolbars.draw) {
        this.drawHandler._toolbars.draw.disable(); // Disables drawing
    }
    
}

private flattenLatLngs(latlngs: any): L.LatLng[] {
  
  const flattened: L.LatLng[] = [];
  latlngs.forEach((latlng: any) => {
      if (Array.isArray(latlng)) {
          flattened.push(...this.flattenLatLngs(latlng));
      } else {
          flattened.push(latlng);
      }
  });
  
  return flattened;
}
private isPointInPolygon(point: L.LatLng, latlngs: L.LatLng[]): boolean {

  const x = point.lng, y = point.lat; // Longitude is X, Latitude is Y
  let inside = false;

  for (let i = 0, j = latlngs.length - 1; i < latlngs.length; j = i++) {
      const xi = latlngs[i].lng, yi = latlngs[i].lat; // Longitude as X, Latitude as Y
      const xj = latlngs[j].lng, yj = latlngs[j].lat;

      const intersect = ((yi > y) !== (yj > y)) ||
                        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) {
          inside = true;
      }
  }
  
  return inside;
}

private isBoundingBoxIntersecting(bbox1: { minLon: number, maxLon: number, minLat: number, maxLat: number },
                                  bbox2: { minLon: number, maxLon: number, minLat: number, maxLat: number }): boolean {
  return !(bbox2.minLon > bbox1.maxLon ||
           bbox2.maxLon < bbox1.minLon ||
           bbox2.minLat > bbox1.maxLat ||
           bbox2.maxLat < bbox1.minLat);
}

/**
 * Helper: Get bounding box from an array of LatLng points or from the map instance.
 * Overloaded: if an array is provided, compute from those points; otherwise, use the map bounds.
 */
private getBoundingBox(input: any): { minLon: number, maxLon: number, minLat: number, maxLat: number } {
  if (input instanceof L.Map) {
    const bounds = input.getBounds();
    return {
      minLon: bounds.getWest(),
      maxLon: bounds.getEast(),
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth()
    };
  } else if (Array.isArray(input)) {
    const lats = input.map((pt: L.LatLng) => pt.lat);
    const lngs = input.map((pt: L.LatLng) => pt.lng);
    return {
      minLon: Math.min(...lngs),
      maxLon: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats)
    };
  }
  throw new Error('Invalid input for getBoundingBox');
}


getBoundingBoxCorner() {
  let bounds = this.map.getBounds();
  return {
      minLon: bounds.getWest(),  // Leftmost longitude
      maxLon: bounds.getEast(),  // Rightmost longitude
      minLat: bounds.getSouth(), // Bottommost latitude
      maxLat: bounds.getNorth()  // Topmost latitude
  };
}

renderFootprints(footprints) {
  let bbox = this.getBoundingBoxCorner();
  let minMap = this.getMapNumber(bbox.minLon);
  let maxMap = this.getMapNumber(bbox.maxLon);

  footprints.forEach((footprint) => {
      for (let mapNum = minMap; mapNum <= maxMap; mapNum++) {
          let correctedLon = footprint.lng + (mapNum - 1) * 360;

          // Ensure footprint is only rendered inside the bounding box
          if (correctedLon >= bbox.minLon && correctedLon <= bbox.maxLon) {
              L.marker([footprint.lat, correctedLon]).addTo(this.map);
          }
      }
  });
}

onFilterset(data) {
  this.removeAllImageOverlays()
  this.sharedService.setOverlayShapeData(null)
  const timeZOne = this.sharedService.timeZoneActive()
  if(!timeZOne){
    if(this.map){
      this.map.setZoom(4)
    }
  } 
  this.filterParams = data.params;
  data.params = {...data.params, source: 'home',  page_number: '1', page_size: '50'}
  this.getDataUsingPolygon(data.payload,  data.params);
  this.cdr.detectChanges();

}


//Extra shapes  clearing functionality
  private clearExtraShapes(): void {
    this.extraShapesLayer?.clearLayers();
  }
  //Snackbar opening functionality
  private openSnackbar(message:string){
    this._snackBar.open(message, 'Ok', {
      duration: 4000  // Snackbar will disappear after 300 milliseconds
    });
  }

   //handle toggle events
   handleToggleEvent(data: string): void {
  
    // if (this.type === data && this.isDrawerOpen) {
    //   // If the clicked type is the same as the current one and the drawer is already open, do nothing
    //   return;
    // }
    // Update the type to switch the drawer's content
    if(data!=''){
      if(this.type !== data){
        this.type = data;
        
        this.isDrawerOpen = true;
        
          this.toggleDrawer()
          this.updateSidebarWidth();
    
      }else{
        this.type = data;
        
        this.isDrawerOpen = true;
        
          this.toggleDrawer()
          this.updateSidebarWidth();
      }
    }else{
    this.type = ''
    this.toggleDrawer();
    this.isDrawerOpen = false;
    this.updateSidebarWidth();

  }
    // Ensure the drawer stays open
  }

  closeSideBar(){
    this.type = ''
    this.toggleDrawer();
    this.isDrawerOpen = false;
    this.updateSidebarWidth();
  }

   //Handles various button actions.
   //* @param action - The type of action to perform.

// Handle user actions with toggle and cleanup
handleAction(action: string): void {
  // this.drawLayer.clearLayers();
  if (this.drawHandler && this.drawHandler.enabled()) {
    this.drawHandler.disable(); // Disable the drawing tool
    if (this.drawLayer) {
      // this.drawLayer.clearLayers(); // Clear any drawn shapes
      this.clearExtraShapes();
    }
  }
  if (this.currentAction === action) {
    this.deactivateAction(action); // Deactivate the same action if already active
    this.currentAction = null;
    return;
  }

  // Deactivate the previous action if switching to a new one
  if (this.currentAction) {
    this.deactivateAction(this.currentAction);
  }

  this.currentAction = action; // Set the new active action

  // Activate the selected action
  switch (action) {
    case 'location':
      this.locateUser();
      break;
    case 'polygon':
      this.enableDrawing('polygon');
      break;
    case 'line':
      this.enableDrawing('line');
      break;
    case 'settings':
      this.toggleZoomControl();
      break;
    case 'layers':
      this.toggleBaseLayer();
      break;
    default:
      console.error('Invalid action');
      this.currentAction = null;
  }
}

  // Locate user and center the map on their location
  private locateUser(): void {
    this.map.eachLayer((layer: any) => {
      if (layer instanceof WMTSLayer) {
          const url = (layer as any)._url; // Type assertion to bypass TypeScript check
          if (typeof url === 'string') {
              this.map.removeLayer(layer);
          }
      }
      
      this.map.eachLayer((layer: any) => {
        if (layer.isWMTS && layer._url) {
          this.map.removeLayer(layer);
        }
      });
  })
    this.map.on('click', (event) => {
      const clickLat = event.latlng.lat;
      const clickLng = event.latlng.lng;
  
      // Add a new marker at the clicked location
      const newMarker = L.marker([clickLat, clickLng], {
        icon: L.icon({
          iconUrl: 'assets/svg-icons/pin-location-icon.svg',
          iconSize: [21, 26],
        }),
      }).addTo(this.map);
      
      
      // Bind a popup to the marker that appears when clicked
      newMarker.on('click', () => {
        // Convert lat/lng to screen coordinates
        const mapContainer = this.map.getContainer();
        const markerPoint = this.map.latLngToContainerPoint({ lat: clickLat, lng: clickLng });
      
        // Default dialog position
        let position = {
          top: `${markerPoint.y + mapContainer.offsetTop}px`,
          left: `${markerPoint.x + mapContainer.offsetLeft + 20}px`,
        };

      const {normalizedLatitude, normalizedLongitude} =  this.getlatlngNormalized(clickLat, clickLng)

      const  payload= {
        latitude:normalizedLatitude,
        longitude:normalizedLongitude,
        distance:1
      }
    
      this.satelliteService.getPinSelectionAnalytics(payload).subscribe({
        next: (resp) => {
          if(resp){
           
            
            const markerData = resp?.data?.analytics
            this.getAddress(clickLat, clickLng).then((address) => {
              const dialogRef = this.dialog.open(MapControllersPopupComponent, {
                width: '357px',
                data: { type: 'marker', markerData:markerData,pointData:payload },
                position,
                panelClass: 'custom-dialog-class',
              });
          
              // After dialog opens, measure and adjust position
              dialogRef.afterOpened().subscribe(() => {
                const dialogElement = document.querySelector('.custom-dialog-class') as HTMLElement;
          
                if (dialogElement) {
                  const dialogHeight = dialogElement.offsetHeight;
                  const mapHeight = mapContainer.offsetHeight;
                  const mapWidth = mapContainer.offsetWidth;
          
                  // Adjust horizontal position (left or right)
                  let newLeft = markerPoint.x + mapContainer.offsetLeft + 20;
                  if (markerPoint.x + 300 > mapWidth) {
                    
                    
                    newLeft = markerPoint.x + mapContainer.offsetLeft - 300 - 20; // Move to the left
                  }
          
                  // Adjust vertical position (top or bottom)
                  let newTop: number;
                  const spaceAboveMarker = markerPoint.y; // Space available above the marker
                  const spaceBelowMarker = mapHeight - markerPoint.y; // Space available below the marker
          
                  if (spaceBelowMarker >= dialogHeight + 20) {
                    // Position dialog below the marker if enough space is available
                    newTop = markerPoint.y + mapContainer.offsetTop + 10; // Add small margin below marker
                  } else if (spaceAboveMarker >= dialogHeight + 20) {
                    // Position dialog above the marker if enough space is available
                    newTop = markerPoint.y + mapContainer.offsetTop - dialogHeight - 10; // Subtract margin above marker
                  } else {
                    // Default fallback: align the dialog vertically centered around the marker
                    newTop = Math.max(
                      mapContainer.offsetTop,
                      Math.min(markerPoint.y + mapContainer.offsetTop - dialogHeight / 2, mapHeight - dialogHeight)
                    );
                  }
                  
                  // Update dialog position dynamically
                  dialogRef.updatePosition({
                    top: `${newTop+10}px`,
                    left: newLeft> 1300? `${newLeft-400}px`: `${newLeft}px`,
                  });
                }
              });
            });
          }
         
        },
        error: (err) => {
          console.log("err getPolyGonData: ", err);
        },
      });
       
      });
      
    });
  }
  
  
  
  //Geting address function
  async getAddress(lat: number, lng: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    try {
      const response: any = await this.http.get(url).toPromise();
      return response.display_name || 'Address not found';
    } catch (error) {
      console.error('Error fetching address:', error);
      return 'Error fetching address';
    }
  }


  private getlatlngNormalized(lat: number, lng: number) {
    // Normalize longitude to [-180, 180]
    const normalizedLongitude = ((lng + 180) % 360 + 360) % 360 - 180;
  
    // Clamp latitude to [-90, 90]
    const normalizedLatitude = Math.max(-90, Math.min(90, lat));
  
    return { normalizedLatitude, normalizedLongitude };
  }
  

  // Enable drawing mode for polygons or lines
  private enableDrawing(shape: string): void {
    // Clear previous layers
    this.drawLayer.clearLayers();
    this.map.eachLayer((layer: any) => {
      if (layer instanceof WMTSLayer) {
          const url = (layer as any)._url; // Type assertion to bypass TypeScript check
          if (typeof url === 'string') {
              this.map.removeLayer(layer);
          }
      }
      
      this.map.eachLayer((layer: any) => {
        if (layer.isWMTS && layer._url) {
          this.map.removeLayer(layer);
        }
      });
  })
    // If there's an active drawing tool, disable it before starting a new one
    if (this.activeDrawTool) {
      this.activeDrawTool.disable();
    }
  
    let drawTool: L.Draw.Polyline | L.Draw.Polygon;
  
    if (shape === 'polygon') {
      drawTool = new L.Draw.Polygon(this.map as L.DrawMap, {
        shapeOptions: {
          color: '#ff7800',
          weight: 4,
        },
      });
    } else if (shape === 'line') {
      drawTool = new L.Draw.Polyline(this.map as L.DrawMap, {
        shapeOptions: {
          color: '#1f78b4',
          weight: 4,
        },
        maxPoints: 2,
      });
    } else {
      console.error('Invalid shape type');
      return;
    }
  
    // Enable the draw tool
    drawTool.enable();
    this.activeDrawTool = drawTool;
  
    // Remove any previous event listeners for 'L.Draw.Event.CREATED'
    this.map.off(L.Draw.Event.CREATED);
  
    // Add the event listener for the new shape
    this.map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
  
      // Log to check how many times the event is being triggered
  
      if (shape === 'line' && layer instanceof L.Polyline) {
        const latlngs = layer.getLatLngs();
        if (latlngs.length === 2) {
          this.drawLayer.addLayer(layer);
        }
      } else if (shape === 'polygon') {
        this.drawLayer.addLayer(layer);
        const bounds = (layer as L.Polygon).getBounds();
        const center = bounds.getCenter();
        const geoJSON = layer.toGeoJSON();
        const payload = { geometry: geoJSON?.geometry };
        let shapeData 
        if (geoJSON.geometry.coordinates.length <= 5) {
          shapeData = {
            coordinates: geoJSON.geometry.coordinates,
            type: 'Rectangle',
          };
        } else {
          shapeData = {
            coordinates: geoJSON.geometry.coordinates,
            type: 'Polygon',
          };
        }
        const orginalCords = this.latLngBoundsToPolygon(bounds)
        const customPayload = {
          geometry:orginalCords
        }
        // API call to get polygon data
        this.satelliteService.getPolyGonData(customPayload).subscribe({
          next: (resp) => {
            this.originalPolygon = resp?.data?.wkt_polygon;
          },
          error: (err) => {
            console.log(err);
          }
        })
        this.satelliteService.getPolyGonData(this.normalizePayloadCoordinates(payload)).subscribe({
          next: (resp) => {
            this.polygon_wkt = resp?.data?.wkt_polygon
            const data = { polygon_wkt: resp.data.wkt_polygon,original_polygon:this.originalPolygon };
            if (resp.data) {
              // API call for polygon selection analytics
              this.satelliteService.getPolygonSelectionAnalytics(data).subscribe({
                next: (res) => {
                  if (res.data) {
                    // No need for layer.once() here, just use layer.on('click', ...)
                    layer.on('click', async (e: L.LeafletEvent) => {
                      const mapContainer = this.map.getContainer();
                      const boundsNorthEast = this.map.latLngToContainerPoint(bounds.getNorthEast());
                      const boundsSouthWest = this.map.latLngToContainerPoint(bounds.getSouthWest());
  
                      // Set the dialog position near the top-right of the polygon
                      const polygonPoint = {
                        x: boundsNorthEast.x,
                        y: boundsSouthWest.y,
                      };
  
                      const position = {
                        top: `${polygonPoint.y + mapContainer.offsetTop}px`,
                        left: `${polygonPoint.x + mapContainer.offsetLeft + 20}px`,
                      };
  
                      // Mock data for dialog content (replace with actual data if needed)
                      const markerData = res?.data?.analytics;
                      const {normalizedLatitude, normalizedLongitude} =  this.getlatlngNormalized(center.lat, center.lng)

                      this.getAddress(normalizedLatitude, normalizedLongitude).then((address) => {
                        const dialogRef = this.dialog.open(MapControllersPopupComponent, {
                          width: '355px',
                          data: { type: 'polygon', markerData: markerData, shapeData: shapeData },
                          position,
                          panelClass: 'custom-dialog-class',
                        });
  
                        dialogRef.afterOpened().subscribe(() => {
                          const dialogElement = document.querySelector('.custom-dialog-class') as HTMLElement;
  
                          if (dialogElement) {
                            const dialogHeight = dialogElement.offsetHeight;
                            const mapHeight = mapContainer.offsetHeight;
                            const mapWidth = mapContainer.offsetWidth;
  
                            let newLeft = polygonPoint.x + mapContainer.offsetLeft + 20;
                            if (polygonPoint.x + 300 > mapWidth) {
                              newLeft = polygonPoint.x + mapContainer.offsetLeft - 300 - 20;
                            }
  
                            let newTop: number;
                            const spaceAbove = polygonPoint.y;
                            const spaceBelow = mapHeight - polygonPoint.y;
  
                            if (spaceBelow >= dialogHeight + 20) {
                              newTop = polygonPoint.y + mapContainer.offsetTop + 10;
                            } else if (spaceAbove >= dialogHeight + 20) {
                              newTop = polygonPoint.y + mapContainer.offsetTop - dialogHeight - 10;
                            } else {
                              newTop = Math.max(
                                mapContainer.offsetTop,
                                Math.min(polygonPoint.y + mapContainer.offsetTop - dialogHeight / 2, mapHeight - dialogHeight)
                              );
                            }
  
                            dialogRef.updatePosition({
                              top: `${newTop}px`,
                              left: `${newLeft}px`,
                            });
                          }
                        });
                      });
                    });
                  }
                },
              });
            }
          },
          error: (err) => {
            console.error('Error fetching polygon data:', err);
          },
        });
      }
    });
  }
  
  
  // Toggle zoom controls on the map
  private toggleZoomControl(): void {
    
    if (this.zoomControlEnabled) {
      this.map.removeControl(this.map.zoomControl);
     
    } else {
      this.map.addControl(L.control.zoom({ position: 'topright' }));
      
    }
    this.zoomControlEnabled = !this.zoomControlEnabled;
  }

  // Toggle between dark and light mode layers
  private toggleBaseLayer(): void {
    if (this.isDarkMode) {
      this.map.removeLayer(this.darkLayer);
      this.lightLayer.addTo(this.map);
      alert('Switched to light mode.');
    } else {
      this.map.removeLayer(this.lightLayer);
      this.darkLayer.addTo(this.map);
      alert('Switched to dark mode.');
    }
    this.isDarkMode = !this.isDarkMode;
  }

  //Deactivating map actions
  private deactivateAction(action: string): void {
    switch (action) {
      case 'location':
        this.clearUserMarker();
        break;
      case 'polygon':
      case 'line':
        this.disableDrawing();
        break;
      case 'settings':
        // Optionally reset zoom controls
        break;
      case 'layers':
        // No specific cleanup for layers
        break;
      default:
        console.error('Invalid action to deactivate');
    }
  }
  
  //Disable map drawings control
  private disableDrawing(): void {

    // Check if a drawing tool is currently active
    if (this.activeDrawTool) {
        // Disable the active drawing tool
        this.activeDrawTool.disable();
        this.activeDrawTool = null;  // Clear the reference to the active tool
    }
}


//Clear map location marker action
private clearUserMarker(): void {
  this.map.off('click')
  if (this.userMarker) {
    this.map.removeLayer(this.userMarker); // Remove the marker from the map
    this.userMarker = null; // Reset the reference
  }

  // Reset maxZoom to the original map configuration
  this.map.options.maxZoom = 20;

  // Optionally reset the zoom level to your default zoom
  if (this.zoomLevel > 20) {
    this.map.setZoom(20); // Adjust zoom if it exceeds maxZoom
  }
}

toggleMapLayer(type:string) {
  this.isGoogleLayerActive = type
  if (this.isGoogleLayerActive ==='OpenStreetMapLight') {
    // Remove Google Streets layer and add Dark Layer
    this.map.removeLayer(this.googleStreets);
    this.map.removeLayer(this.darkLayer)
    this.map.removeLayer(this.googlestreetDarkLayer)
    this.map.removeLayer(this.hybridLayer)
    this.lightLayer.addTo(this.map);
  } else if(this.isGoogleLayerActive === 'OpenStreetMapDark') {
    // Remove Dark Layer and add Google Streets layer
    this.map.removeLayer(this.googleStreets);
    this.map.removeLayer(this.lightLayer)
    this.map.removeLayer(this.googlestreetDarkLayer)
    this.map.removeLayer(this.hybridLayer)
    this.darkLayer.addTo(this.map);
  }else if(this.isGoogleLayerActive === 'GoogleStreetMapLight') {
    // Remove Dark Layer and add Google Streets layer
    this.map.removeLayer(this.darkLayer);
    this.map.removeLayer(this.lightLayer)
    this.map.removeLayer(this.googlestreetDarkLayer)
    this.map.removeLayer(this.hybridLayer)
    this.googleStreets.addTo(this.map);
  } else if(this.isGoogleLayerActive === 'hybridLayer'){
    this.map.removeLayer(this.darkLayer);
    this.map.removeLayer(this.googleStreets)
    this.map.removeLayer(this.googlestreetDarkLayer)
    this.map.removeLayer(this.hybridLayer)
    this.hybridLayer.addTo(this.map);
  } else {
    this.map.removeLayer(this.darkLayer);
    this.map.removeLayer(this.lightLayer)
    this.map.removeLayer(this.googleStreets)
    this.map.removeLayer(this.hybridLayer)
    this.googlestreetDarkLayer.addTo(this.map);
  }
  
}

onDateRangeChanged(event: { startDate: string, endDate: string }) {

  const formattedStartDate = dayjs(event.startDate).utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');
  const formattedENdDate = dayjs(event.endDate).utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');
  this.startDate = formattedStartDate;
  this.endDate = formattedENdDate;

  
  if (this.data) {
    let queryParams ={
      ...this.filterParams,
      page_number: '1',
      page_size: '50',
      start_date:this.startDate,
      end_date: this.endDate
    }
    // this.closeDrawer()
    this.sharedService.setDrawShape(true);
      this.drawer.toggle();
      this.handleDropdownToggle(this.isDrawerOpen)
      this.drawer._animationState = 'open';
      const payload = {
        ...this.data,
        original_polygon:this.originalPolygon
       }
       
  this.getDataUsingPolygon(payload,queryParams);
  }
  this.cdr.detectChanges();

}

// Handle the dropdown toggle event from the child
handleDropdownToggle(state: boolean) {
  this.showLayers = false
  this.isDropdownOpen = state;
}

handleLayersToggle(state:boolean){
  this.isDropdownOpen = false
  this.showLayers = state;
}

closeDropdown() {
  this.isDropdownOpen = false;
  this.showLayers = false
}

//open map controller pop up
openDialog(data: any, position: { top: string; left: string }): void {
  
  this.dialog.open(MapControllersPopupComponent, {
    width: '300px',
    data: data,
    position: position, // Dynamically calculated position
  });
}

// Method to open the dialog at a specific position
private openDialogAtPosition(polygon: any, metadata: any): void {
  const bounds = polygon.getBounds();
  const mapContainer = this.map.getContainer();
  const boundsNorthEast = this.map.latLngToContainerPoint(bounds.getNorthEast());
  const boundsSouthWest = this.map.latLngToContainerPoint(bounds.getSouthWest());

  const dialogWidth = 272; // Dialog's fixed width
  const dialogHeight = 200; // Dialog's approximate height
  const offset = 10; // Small padding to avoid overlap

  let position: { top: string; left: string };

  // Check if zoom level is greater than 8
  if (this.zoomLevel > 8) {
    // Center the dialog on the screen
    const centerX = mapContainer.offsetWidth / 2 - dialogWidth / 2;
    const centerY = mapContainer.offsetHeight / 2 - dialogHeight / 2;

    position = {
      top: `70px`,
      left: `${centerX + mapContainer.offsetLeft}px`,
    };
  } else {
    // Set the dialog position near the top-right of the polygon
    const polygonPoint = {
      x: boundsNorthEast.x,
      y: boundsSouthWest.y,
    };

    position = {
      top: `-100px`,
      left: `${polygonPoint.x + mapContainer.offsetLeft + 20}px`,
    };
    
  }

  // Open the dialog with the calculated position
  const dialogRef = this.dialog.open(MapControllersPopupComponent, {
    width: `${dialogWidth}px`,
    height: 'auto',
    data: { type: 'vendor', vendorData: metadata },
    position,
    panelClass: 'custom-dialog-class',
  });

  // Re-adjust dialog position dynamically after opening if zoom level <= 8
  if (this.zoomLevel <= 8) {
    dialogRef.afterOpened().subscribe(() => {
      const dialogElement = document.querySelector('.custom-dialog-class') as HTMLElement;

      if (dialogElement) {
        const dialogHeight = dialogElement.offsetHeight;
        const mapHeight = mapContainer.offsetHeight;
        const mapWidth = mapContainer.offsetWidth;

        const polygonPoint = {
          x: boundsNorthEast.x,
          y: boundsSouthWest.y,
        };

        let newLeft = polygonPoint.x + mapContainer.offsetLeft + 20;
        if (polygonPoint.x + 300 > mapWidth) {
          newLeft = polygonPoint.x + mapContainer.offsetLeft - 300 - 20;
        }

        let newTop: number;
        const spaceAbove = polygonPoint.y;
        const spaceBelow = mapHeight - polygonPoint.y;

        if (spaceBelow >= dialogHeight + 20) {
          
          newTop = polygonPoint.y + mapContainer.offsetTop ;
        } else if (spaceAbove >= dialogHeight + 20) {
          
          newTop = polygonPoint.y + mapContainer.offsetTop - dialogHeight - 40;
        } else {
          
          newTop = Math.max(
            mapContainer.offsetTop,
            Math.min(polygonPoint.y + mapContainer.offsetTop - dialogHeight / 2, mapHeight - dialogHeight - 20)
          );
        }

        dialogRef.updatePosition({
         
          left: `${newLeft}px`,
        });
      }
    });
  }

  dialogRef.afterClosed().subscribe((result) => {
    this.popUpData = null
  });
}
 
receiveData(dataArray: any[]) {
  // Initialize the imageOverlays map if it doesn't exist
  if (!this.imageOverlays) {
    this.imageOverlays = new Map<string, L.ImageOverlay>();
  }

  // Create a set to track currently visible image URLs
  const currentImageUrls = new Set(dataArray.map(data => data.presigned_url));

  // Remove overlays that are no longer in the data array
  this.imageOverlays.forEach((overlay, url) => {
    if (!currentImageUrls.has(url)) {
      this.map.removeLayer(overlay);
      this.imageOverlays.delete(url);
    }
  });
  const vendorIds = dataArray.map(item => item.vendor_id); // Extract vendor_id values
  const tileUrls = dataArray.map(item=> item.tiles_url)
  this.map.eachLayer((layer: any) => {
    if (layer instanceof WMTSLayer) {
        const url = (layer as any)._url; // Type assertion to bypass TypeScript check
        if (typeof url === 'string' && !vendorIds.some(id => url.includes(id))) {
            this.map.removeLayer(layer);
        }
    }
    
    this.map.eachLayer((layer: any) => {
      if (layer.isWMTS && layer._url && !tileUrls.some(url => layer._url.includes(url))) {
        this.map.removeLayer(layer);
      }
    });

});

  // Check if the data array is valid and has coordinates
  if (dataArray && dataArray.length > 0) {
    const allBounds: L.LatLngBounds[] = [];

    dataArray.forEach(async(data) => {
      
      
      if (data?.coordinates_record?.coordinates) {

        const LatLngs: L.LatLngExpression[] = [];

        this.bbox = this.getBoundingBox(this.map);
        this.minMap = this.getMapNumber(this.bbox.minLon);
        this.maxMap = this.getMapNumber(this.bbox.maxLon);

        const originalCoordinates  = data.coordinates_record.coordinates[0]; // Access the first array of coordinates
      
        // Convert [lng, lat] to [lat, lng] (Leaflet requires [lat, lng] format)
       for (let mapNum = this.minMap; mapNum <= this.maxMap; mapNum++) {
        // Adjust each coordinate in the polygon.
        const adjustedLatLngs = originalCoordinates.map((coord: [number, number]) => {
          // Convert [lng, lat] to [lat, lng] and adjust longitude using mapFormula and mapNum offset.
          return [
            coord[1],
            // coord[0] + this.mapFormula + (mapNum - 1) * 360,
            coord[0] + (mapNum - 1) * 360 ,
          ];
        });
          LatLngs.push(adjustedLatLngs);
      }

        // Create bounds for the current image
        const bounds = L.latLngBounds(LatLngs);
        allBounds.push(bounds);

        // Check if the image overlay already exists
        if (!this.imageOverlays.has(data.presigned_url)) {
          
          if (data.vendor_name === 'airbus' && data.is_purchased) {

               // Fetch WMTS Info
            const wmtsInfo = await this.wmtsService.fetchWMTSInfo(data?.vendor_id);
            if (!wmtsInfo || !wmtsInfo.tileUrlTemplate) {
              alert("Failed to load WMTS tiles.");
              return;
            }

            // Construct the WMTS Tile URL Template
            const tileUrlTemplate = wmtsInfo.tileUrlTemplate
              .replace("{Style}", "rgb")  // Ensure this matches an available style
              .replace("{TileMatrixSet}", 'EPSG3857' );

            this.map.createPane("wmtsPane");
            this.map.getPane("wmtsPane").style.zIndex = "500000"; // Higher z-index
            this.map.getPane("wmtsPane").style.opacity = "1";

            const wmtsLayer = new WMTSLayer(tileUrlTemplate, {
            token: this.wmtsService.getToken(),
            tileSize: 256,
            minZoom: 0,
            maxZoom: 20,
            bounds: bounds, // Pass your bounds here
            pane: "wmtsPane" // Assign the layer to the new pane
            });

            wmtsLayer.addTo(this.map);

          
        
          } else if(data.vendor_name ==='skyfi-umbra' &&data.is_purchased){
            const tileUrlTemplate = data.tiles_url
              
            this.map.createPane("wmtsPane");
            this.map.getPane("wmtsPane").style.zIndex = "500000"; // Higher z-index
            this.map.getPane("wmtsPane").style.opacity = "1";

            const wmtsLayer = L.tileLayer(tileUrlTemplate, {
              attribution: '© SkyFi',
              maxZoom: 20,
            });
            
            // Add a custom property to mark it as a WMTS layer
            (wmtsLayer as any).isWMTS = true;
            
            wmtsLayer.addTo(this.map);
          } else {
            // Add the image overlay for other vendors
            const imageOverlay = L.imageOverlay(data.presigned_url, bounds, {
              opacity: 1,
              zIndex: 1000,
            });
        
            imageOverlay.on('mouseover', (event) => {
              this.onPolygonHover(data?.vendor_id);
            });
        
            imageOverlay.on('mouseout', (event) => {
              this.onPolygonOut(null);
            });
        
            imageOverlay.addTo(this.map);
        
            // Store the overlay in the map for tracking
            this.imageOverlays.set(data.presigned_url, imageOverlay);
          }
        }
        
      }
    });

    // Combine all bounds into one if needed
    // const combinedBounds = allBounds.reduce((acc, bounds) => acc.extend(bounds), L.latLngBounds([]));
    // this.map.fitBounds(combinedBounds); // Fit the map to the bounds of all overlays
  } else {
    // Handle case where there are no valid coordinates
    this.imageOverlays.forEach((overlay) => this.map.removeLayer(overlay));
    this.imageOverlays.clear();
  }
}

// getLayer() {
//   this.satelliteService
//   .getCapabilities('https://access.foundation.api.oneatlas.airbus.com/api/v1/items/f9555a9f-f53c-4746-bd7f-7757d8ad3632/wmts')
//   .subscribe((xmlText) => {
//     const parser = new XmlParser();
//     const xml = parser.parse(xmlText);

//     // Extract tileMatrixSet and layer name
//     const layerName = 'your_layer_name';
//     const tileMatrixSet = 'EPSG:3857'; // Modify based on GetCapabilities response
//     const tileFormat = 'image/png'; // Modify based on GetCapabilities

//     const wmtsLayer = L.tileLayer(
//       `https://access.foundation.api.oneatlas.airbus.com/api/v1/items/f9555a9f-f53c-4746-bd7f-7757d8ad3632/wmts/tile/{z}/{x}/{y}.${tileFormat}`,
//       {
//         attribution: '&copy; Your Attribution',
//         tileSize: 256,
//         minZoom: 0,
//         maxZoom: 18,
//         subdomains: 'abc',
//       }
//     );

//     wmtsLayer.addTo(this.map);
//   });
// }

handleMakerData(data: any) {

  // Check if the data object is valid and has coordinates
  if (data?.coordinates_record?.coordinates) {

    const LatLngs: L.LatLngExpression[] = [];

    this.bbox = this.getBoundingBox(this.map);
    this.minMap = this.getMapNumber(this.bbox.minLon);
    this.maxMap = this.getMapNumber(this.bbox.maxLon);

    const originalCoordinates  = data.coordinates_record.coordinates[0]; // Access the first array of coordinates
  // if (this.minMap == 0) {
  //   this.minMap = 1;
  //   this.maxMap = 2;
  // }
    // Convert [lng, lat] to [lat, lng] (Leaflet requires [lat, lng] format)
   for (let mapNum = this.minMap; mapNum <= this.maxMap; mapNum++) {
    // Adjust each coordinate in the polygon.
    const adjustedLatLngs = originalCoordinates.map((coord: [number, number]) => {
      // Convert [lng, lat] to [lat, lng] and adjust longitude using mapFormula and mapNum offset.
      return [
        coord[1],
        // coord[0] + this.mapFormula + (mapNum - 1) * 360,
        coord[0] + (mapNum - 1) * 360 ,
      ];
    });
    // Check if at least one adjusted coordinate is within the bounding box.
    // const visible = adjustedLatLngs.some(([lat, lng]) =>
    //   lng >= this.bbox.minLon && lng <= this.bbox.maxLon &&
    //   lat >= this.bbox.minLat && lat <= this.bbox.maxLat
    // );
    // if (visible) {
      LatLngs.push(adjustedLatLngs);
    // }
  }
    // Extract the coordinates and map them to Leaflet's LatLng format
    // const coordinates = data.coordinates_record.coordinates[0].map((coord: number[]) =>
    //   new L.LatLng(coord[1], coord[0]+ this.mapFormula) // Convert [lon, lat] to [lat, lon]
    // );

    // Create bounds for the current shape
    const bounds = L.latLngBounds(LatLngs);

    // Highlight the coordinates with a green border (polygon)
    const polygon = L.polygon(LatLngs, {
      color: 'green', // Set border color to green
      weight: 3,
    }) as L.Polygon & { vendorData: any };
    
    // Attach custom data to the polygon
    polygon.vendorData = data; // Ensuring TypeScript recognizes vendorData
    
    // Add event listeners for hover effects
    polygon.on('mouseover', () => this.onPolygonHover(data.vendor_id));
    polygon.on('mouseout', () => this.onPolygonOut(null));
    

    // Adjust the map view to fit the bounds of the shape
    this.map.fitBounds(bounds, {
      padding: [20, 20], // Optional: Add padding to ensure the shape is fully visible
      maxZoom: 10, // Set a maximum zoom level
    });
  } else {
    // Handle case where there are no valid coordinates
  }
}



setDynamicHeight(): void {
  // Get the height of the elements above
  const header = document.getElementById('header');

  
  // Calculate the total height of all the above elements
  const totalHeight = [
    header,
   
  ].reduce((acc, el) => acc + (el ? el.offsetHeight : 0), 0);

  // Get the height of the viewport
  const viewportHeight = window.innerHeight;

  // Calculate the remaining height for the target div
  const remainingHeight = viewportHeight - totalHeight - 2;

  // Get the content div and apply the calculated height
  const contentDiv = this.el.nativeElement.querySelector('.library');
  if (contentDiv) {
    this.renderer.setStyle(contentDiv, 'height', `${remainingHeight}px`);
  }
}
ngOnDestroy(): void {
  window.removeEventListener('resize', this.setDynamicHeight.bind(this));  // Clean up event listener
}

highLightShape(data: any): void {
  // console.log(data, 'highLightShape');

  // If data is null or invalid, remove the highlighted polygon
  if (!data || !data.coordinates_record?.coordinates) {
    if (this.highlightedPolygon) {
      this.map.removeLayer(this.highlightedPolygon); // Remove the polygon from the map
      this.highlightedPolygon = null; // Clear the reference
    }
    return; // Exit the method
  }

  // Remove the existing polygon if one is already highlighted
  if (this.highlightedPolygon) {
    this.map.removeLayer(this.highlightedPolygon);
  }
  

  const LatLngs: L.LatLngExpression[] = [];

  this.bbox = this.getBoundingBox(this.map);
  this.minMap = this.getMapNumber(this.bbox.minLon);
  this.maxMap = this.getMapNumber(this.bbox.maxLon);

  const originalCoordinates  = data.coordinates_record.coordinates[0]; // Access the first array of coordinates
// if (this.minMap == 0) {
//   this.minMap = 1;
//   this.maxMap = 2;
// }
  // Convert [lng, lat] to [lat, lng] (Leaflet requires [lat, lng] format)
 for (let mapNum = this.minMap; mapNum <= this.maxMap; mapNum++) {
  // Adjust each coordinate in the polygon.
  const adjustedLatLngs = originalCoordinates.map((coord: [number, number]) => {
    // Convert [lng, lat] to [lat, lng] and adjust longitude using mapFormula and mapNum offset.
    return [
      coord[1],
      // coord[0] + this.mapFormula + (mapNum - 1) * 360,
      coord[0] + (mapNum - 1) * 360 ,
    ];
  });
  // Check if at least one adjusted coordinate is within the bounding box.
  // const visible = adjustedLatLngs.some(([lat, lng]) =>
  //   lng >= this.bbox.minLon && lng <= this.bbox.maxLon &&
  //   lat >= this.bbox.minLat && lat <= this.bbox.maxLat
  // );
  // if (visible) {
    LatLngs.push(adjustedLatLngs);
  // }
}

  // Extract the coordinates and map them to Leaflet's LatLng format
  // const coordinates = data.coordinates_record.coordinates[0].map((coord: number[]) =>
  //   new L.LatLng(coord[1], coord[0]+this.mapFormula) // Convert [lon, lat] to [lat, lon]
  // );

  // Determine the color based on the vendor name
  let color = '#eff24d'; // Default color
  switch (data.vendor_name) {
    case 'planet':
      color = '#55FF00';
      break;
    case 'blacksky':
      color = '#FFFF00';
      break;
    case 'maxar':
      color = '#FFAA00';
      break;
    case 'airbus':
      color = '#0070FF';
      break;
    case 'skyfi':
      color = '#A900E6';
      break;
    default:
      color = '#7A00B3';
      break;
  }

  // Create a new polygon
  this.highlightedPolygon = L.polygon(LatLngs, {
    color: color, // Outline color
    fillColor: color, // Fill color
    fillOpacity: 0.5, // Adjust opacity as needed
  });

  // Add the polygon to the map
  this.highlightedPolygon.addTo(this.map); // Replace `this.map` with your Leaflet map variable
}

// Function to construct WKT from bounds
// Function to calculate the WKT polygon for the visible portion of the draw 
layercalculateVisibleWKT(): void {
  if (!this.map || !this.drawLayer || !this.polygon) {
    console.error('Map, draw layer, or polygon is not initialized.');
    return;
  }

  // Ensure map size is recalculated if the container has changed
  // this.map.invalidateSize();

  // Get the bounds of the drawn shapes or fallback to polygon bounds
  let drawLayerBounds: L.LatLngBounds | null = this.drawLayer.getBounds();

  if (!drawLayerBounds || !drawLayerBounds.isValid()) {
    drawLayerBounds = this.polygon.getBounds();
  }

  // Get the visible map bounds
  const visibleBounds = this.map.getBounds();

  if (!visibleBounds || !visibleBounds.isValid()) {
    console.error('Visible map bounds are invalid.');
    return;
  }

  // Convert bounds to polygons
  const drawPolygon = this.boundsToPolygon(drawLayerBounds);
  const visiblePolygon = this.boundsToPolygon(visibleBounds);


  try {
    // Calculate the intersection using martinez-polygon-clipping
    const intersection = martinez.intersection(drawPolygon.coordinates, visiblePolygon.coordinates);

    if (intersection && intersection.length > 0) {

      // Convert the intersection to WKT
      const intersectionWKT = this.polygonToWKT(intersection);


      if (this.isWktGreater(intersectionWKT, this.polygon_wkt)) {
        this.zoomed_wkt_polygon = intersectionWKT; // Reset value if not greater
      } else if(this.zoomed_status) {
        this.zoomed_wkt_polygon = intersectionWKT; // Store the new WKT;
      } else {
        
        this.zoomed_wkt_polygon = this.polygon_wkt;
      }
    } else {
      this.zoomed_wkt_polygon = ''; // Reset if no intersection
    }

    this.cdr.detectChanges();
  } catch (error) {
    console.error('Error calculating intersection:', error);
  }
}



boundsToPolygon(bounds: L.LatLngBounds): any {
  const corners = [
    bounds.getSouthWest(),
    bounds.getNorthWest(),
    bounds.getNorthEast(),
    bounds.getSouthEast(),
    bounds.getSouthWest() // Close the polygon
  ];

  const coordinates = corners.map((latLng) => [latLng.lng, latLng.lat]);
  return {
    type: 'Polygon',
    coordinates: [coordinates] // Martinez requires an array of arrays
  };
}
polygonToWKT(polygon: any): string {
  const wktCoordinates = this.normalizePayloadZoomCoordinates(polygon[0])
    .map((ring: any) =>
      ring.map((coord: any) => `${coord[0]} ${coord[1]}`).join(', ')
    )
    .join('), (');

  return `POLYGON((${wktCoordinates}))`;
}


// Helper function to calculate intersection bounds
getIntersectionBounds(bounds1: L.LatLngBounds, bounds2: L.LatLngBounds): L.LatLngBounds | null {
  const north = Math.min(bounds1.getNorth(), bounds2.getNorth());
  const south = Math.max(bounds1.getSouth(), bounds2.getSouth());
  const east = Math.min(bounds1.getEast(), bounds2.getEast());
  const west = Math.max(bounds1.getWest(), bounds2.getWest());

  if (north >= south && east >= west) {
    return L.latLngBounds(L.latLng(south, west), L.latLng(north, east));
  }

  return null; // No intersection
}

// Helper function to convert bounds to WKT polygon
boundsToWKT(bounds: L.LatLngBounds): string {
  const corners = [
    bounds.getSouthWest(),
    bounds.getNorthWest(),
    bounds.getNorthEast(),
    bounds.getSouthEast(),
    bounds.getSouthWest(), // Close the polygon
  ];

  const wkt = `POLYGON((${corners
    .map((latLng) => `${latLng.lng} ${latLng.lat}`)
    .join(', ')}))`;

  return wkt;
}

// Helper function to compare WKT values
isWktGreater(wkt1: string, wkt2: string): boolean {
  // Convert WKT to LatLngBounds to calculate the area
  // console.log(wkt2,'wkt2wkt2wkt2wkt2wkt2',wkt1);
  
  const bounds1 = this.wktToBounds(wkt1);
  const bounds2 = this.wktToBounds(wkt2);
  
  // Compare areas of the bounds
  const area1 = this.calculateArea(bounds1);
  const area2 = this.calculateArea(bounds2);
  this.zoomed_status = +area1.toFixed(1) < +area2.toFixed(1)
  return +area1.toFixed(1) < +area2.toFixed(1);
}

// Helper function to calculate area of bounds
calculateArea(bounds: L.LatLngBounds): number {
  if (!bounds) return 0;

  const width = bounds.getEast() - bounds.getWest();
  const height = bounds.getNorth() - bounds.getSouth();
  return Math.abs(width * height); // Return absolute area
}

// Helper function to convert WKT to LatLngBounds
wktToBounds(wkt: string): L.LatLngBounds {
  
  // Match the coordinates part of the WKT
  const match = wkt.match(/POLYGON\s*\(\(\s*(.*?)\s*\)\)/);

  if (!match || !match[1]) {
    console.error('Invalid WKT format.');
    return null;
  }

  // Split coordinates by commas
  const coords = match[1]
    .split(',')
    .map(coord => coord.trim().split(/\s+/).map(Number)); // Split by space or multiple spaces

  // Ensure we have at least four points (including the closing point)
  if (coords.length < 4) {
    console.error('Invalid WKT: Not enough coordinates to form a polygon.');
    return null;
  }

  // Convert to LatLngs and ensure valid format
  try {
    const latLngs = coords.map(([lng, lat]) => L.latLng(lat, lng));
    return L.latLngBounds(latLngs);
  } catch (error) {
    console.error('Error creating LatLngBounds:', error);
    return null;
  }
}

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  //Image layers removing functionality
  removeAllImageOverlays() {
    if (this.imageOverlays) {
      this.imageOverlays.forEach((overlay) => {
        this.map.removeLayer(overlay); // Remove the overlay from the map
      });
      this.imageOverlays.clear(); // Clear the map to remove all stored overlays
    }
  }

  //Map data filtering functionality
  filterData(queryParams:any){
    const payload = {
      ...this.data,
      original_polygon:this.originalPolygon
     }

    this.getDataUsingPolygon(payload,queryParams);
  }
  // Define hover functions
  onPolygonHover(data) {
    this.sharedService.setRowHover(data)
  }

  onPolygonOut(data) {
    if(this.vendorData ==null){
      this.sharedService.setRowHover(data)
    }  
  }

  closeMarkerPopup(){
    this.vendorData = null
    this.sharedService.setRowHover(null)
  }
  handleFootprintToggle(){
    this.footPrintActive = !this.footPrintActive
     this.bbox = this.getBoundingBox(this.map);
    this.minMap = this.getMapNumber(this.bbox.minLon);
    this.maxMap = this.getMapNumber(this.bbox.maxLon);
        if (Array.isArray(this.shapeLayersData)&& this.footPrintActive) {
          this.footprintLoader = true;
          this.ngxLoader.startLoader('buttonLoader');
          setTimeout(() => {
            this.shapeLayersData.forEach((item: any) => {
              this.addPolygonWithMetadata(item);
            });
            this.footprintLoader = false;
            this.ngxLoader.stopLoader('buttonLoader');
          },300)
         
          
         
        } else {
          this.extraShapesLayer?.clearLayers()
        }
  }

  calendarData(payload,queryParams,state){
    this.satelliteService.getPolygonCalenderDays(payload,queryParams).subscribe({
      next: (resp) => {
        this.ngxLoader.stop()
        this.calendarApiData = resp.data;
        this.OpenEventCalendar = state
      },
      error: (err) => {
        this.ngxLoader.stop()
        console.error('Error fetching calendar data', err);
        // Hide loader on error
         
      },
      
    });
  }

}

function onPolygonHover(e: any, LeafletMouseEvent: any) {
  throw new Error('Function not implemented.');
}

