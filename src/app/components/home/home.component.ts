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
import { NgxUiLoaderService } from 'ngx-ui-loader';
(window as any).type = undefined;


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
    MapCalendarComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit,OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @ViewChild('drawer') drawer?: MatDrawer;
  map!: L.Map;
  zoomLevel: number = 4;
  longitude: number = -90;
  latitude: number = 40;
  parentZoomLevel: number = 4
  drawLayer!: L.FeatureGroup;
  extraShapesLayer!: L.FeatureGroup;
  vectorLayer!: L.LayerGroup;
  type: string = '';
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
  leftMargin:any
  private highlightedPolygon: L.Polygon | null = null;
  calendarApiData:any;
  zoomed_wkt_polygon:any = '';
  shapeType:string=''
  constructor(@Inject(PLATFORM_ID) private platformId: Object,
   private satelliteService:SatelliteService,private dialog: MatDialog,
   private http: HttpClient,
   private sharedService:SharedService,
   private el: ElementRef, private renderer: Renderer2,
   private cdr: ChangeDetectorRef,
   private ngxLoader: NgxUiLoaderService
  )
  {
    this.data = null;
  }

  ngOnInit(): void {
    this.setDynamicHeight();
    window.addEventListener('resize', this.setDynamicHeight.bind(this))
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
    }
    
    
    this.sharedService.isOpenedEventCalendar$.subscribe((state) => {

    if(state){
      if(this.polygon_wkt ){
        const payload = {
          polygon_wkt: this.polygon_wkt,
          start_date: this.startDate,
          end_date: this.endDate
        }
        
        // Start the loader
       
      
        this.satelliteService.getPolygonCalenderDays(payload).subscribe({
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
  }

  //openstreetmap search and location markers function
  onSearchLocation(result: google.maps.places.PlaceResult) {


   
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    const lat = result.geometry?.location?.lat()!;
    const lng = result.geometry?.location?.lng()!;
    // Move the map to the searched location
    this.map.setView([lat, lng], this.zoomLevel);
    const markerIcon = L.icon({
      iconUrl: 'assets/svg-icons/pin-location-icon.svg',  // Adjust the path if necessary
      iconSize: [25, 41],  // Adjust the icon size
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    
    // Add a marker to the map
    const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(this.map);
    // Optionally bind a popup to the marker
    marker.bindPopup(`<b>Location:</b> ${result.formatted_address}`).openPopup();
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
      worldCopyJump: true, // Allow world wrapping
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
      weight: 1, // Border thickness
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
    console.log('Polygon GeoJSON:', geoJSON);
    console.log('Polygon Bounds:', polygonBounds);
  
    // Pass the GeoJSON and bounds to your custom function
    this.getPolygonFromCoordinates({ geometry: geoJSON.geometry }, polygonBounds);
  
    // Add zoom change listener
    // this.map.on('zoomend', () => {
    //   console.log('Zoom changed:', this.map.getZoom());
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
    //      console.log('WKT of the zoomed polygon:', wkt);
    // }
    // });
  
    // Add mousemove event to track coordinates
    this.map.on('mousemove', (event: L.LeafletMouseEvent) => {
      const coords = event.latlng;
      this.longitude = parseFloat(coords.lng.toFixed(6));
      this.latitude = parseFloat(coords.lat.toFixed(6));
    });
  
    // Adjust view to clamp latitude if necessary
    this.map.on('move', () => {
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
      console.log('Map clicked at:', event.latlng);
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
      console.log('GeoJSON of created feature:', geoJSON);
    });
    this.map.on('zoomend', () => {
      console.log('Zoom changed:', this.map.getZoom());
      this.zoomLevel = this.map.getZoom();
      if (this.map.getZoom() < 4) {
        this.map.setZoom(4); // Prevent zooming out below the minimum level
      }
      
        // Get the bounds of the drawn shape
         // Get the bounds of the drawn shape
         this.layercalculateVisibleWKT();
    
    });

    this.map.on('dragend', () => {
      console.log('Drag changed:', this.map.getZoom());

      
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
  
  
  private adjustMapCenter(containerWidth: number): void {
    // Adjust the center based on the width
    const adjustedLongitude = containerWidth / 100; // Example calculation, tweak as needed
    const adjustedCenter: L.LatLngExpression = [22.5, 112.5 + adjustedLongitude];
   
    this.map.setView(adjustedCenter, this.zoomLevel);

    console.log(`Map center adjusted dynamically based on width: ${containerWidth}px`);
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
    console.log('Zoom level updated in parent:', this.parentZoomLevel);
    this.map.setZoom(this.parentZoomLevel);
    if (this.drawLayer) {
      // Get the bounds of the drawn shape
      const bounds = this.drawLayer.getBounds();
      
      // Log the coordinates of the zoomed area (bounds)
      console.log('Bounds of the drawn shape:', bounds);
      
      // Optionally, log the north-east and south-west coordinates
      console.log('South-West corner:', bounds.getSouthWest());
      console.log('North-East corner:', bounds.getNorthEast());
  }
  }

  //angular drawer toggle function
  toggleDrawer(): void {
    if (this.drawer && this.type) {
      
      console.log(this.drawer,'drawerdrawerdrawerdrawerdrawerdrawer');
      this.drawer.toggle();
      this.handleDropdownToggle(this.isDrawerOpen)
      this.drawer._animationState = 'open';
        const mapContainer = this.mapContainer.nativeElement;
        mapContainer.style.marginLeft = `${this.leftMargin}px`;
      
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
  }

  //map shape drawing function
  setDrawType(type: any): void {
    console.log("Selected Draw Type:", type);
    this.currentAction = null;
   this.shapeType = type

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
        console.log("Previous draw handler disabled.");
    }

    // Clear existing layers
    if (this.drawLayer) {
        this.drawLayer.clearLayers();
        this.clearExtraShapes();
    }

    // Define options for the specific shape type
    let drawHandler: any;

    if (type === 'Polygon') {
        console.log('Starting Polygon drawing...');
        drawHandler = new L.Draw.Polygon(this.map as L.DrawMap, {
            showArea: true,
            shapeOptions: {
                color: '#ff6666',
                fillColor: 'rgba(102, 204, 102, 0.1)',
                weight:1
            },
        });
    } else if (type === 'Circle') {
        console.log('Starting Circle drawing...');
        drawHandler = new L.Draw.Circle(this.map as L.DrawMap, {
            shapeOptions: {
                color: '#3399ff',
                fillColor: 'rgba(102, 204, 102, 0.1)',
                weight:1
            },
        });
    } else if (type === 'Box') {
        console.log('Starting Rectangle (Box) drawing...');
        drawHandler = new L.Draw.Rectangle(this.map as L.DrawMap, {
            shapeOptions: {
                color: '#66cc66',
                fillColor: 'rgba(102, 204, 102, 0.1)',
                weight:1
            },
        });
    }

    if (drawHandler) {
        // Start the drawing process immediately
        drawHandler.enable();
        this.drawHandler = drawHandler; // Store the handler for later use

        // Add an event listener for when the shape is created
        this.map.on(L.Draw.Event.CREATED, (event: any) => {
            const layer = event.layer; // The drawn layer
            this.drawLayer.addLayer(layer); // Add to the feature group

            console.log("Drawn Layer Type:", event.layerType);

            if (event.layerType === 'polygon' && type === 'Polygon') {
              const bounds = (layer as L.Polygon).getBounds();
              console.log('Polygon Bounds:', bounds);
              const geoJSON = layer.toGeoJSON();
               this.zoomed_wkt_polygon = ''
              this.getPolygonFromCoordinates({ geometry: geoJSON?.geometry }, bounds);
              setTimeout(() => {
                this.map.fitBounds(bounds, {
                    padding: [50, 50], // Adds padding around the bounds
                    maxZoom: 16        // Caps the zoom level
                });
            }, 1000);            
             
             
          } else if (event.layerType === 'circle' && type === 'Circle') {
              const bounds = (layer as L.Circle).getBounds();
              console.log('Circle Bounds:', bounds);
              const geoJSON = layer.toGeoJSON();
               this.zoomed_wkt_polygon = ''
              this.getPolygonFromCoordinates({ geometry: geoJSON?.geometry }, bounds);
              setTimeout(() => {
                this.map.fitBounds(bounds, {
                    padding: [50, 50], // Adds padding around the bounds
                    maxZoom: 16        // Caps the zoom level
                });
            }, 1000);            
             
          } else if (event.layerType === 'rectangle' && type === 'Box') {
              const bounds = (layer as L.Rectangle).getBounds();
              console.log('Rectangle Bounds:', bounds);
              const geoJSON = layer.toGeoJSON();
               this.zoomed_wkt_polygon = ''
              this.getPolygonFromCoordinates({ geometry: geoJSON?.geometry }, bounds);
             
              setTimeout(() => {
                this.map.fitBounds(bounds, {
                    padding: [50, 50], // Adds padding around the bounds
                    maxZoom: 16        // Caps the zoom level
                });
            }, 1000);            
              
          }

            // Disable the draw handler after the shape is created
            drawHandler.disable();
            this.map.off(L.Draw.Event.CREATED); // Remove the event listener
            type = null;

            console.log("Drawing disabled after shape creation.");
        });
         this.zoomed_wkt_polygon = ''

        // Add event listener to remove tooltip when drawing starts/stops
        this.map.on('draw:drawstart', () => {
            console.log("Drawing started...");
        });
        this.map.on('draw:drawstop', () => {
            console.log("Drawing stopped...");
        });
    } else {
        console.error("Invalid draw type specified.");
    }
}

  //Getting the polygon from cordinates functionality
  getPolygonFromCoordinates(payload:{geometry:{type:string,coordinates:any[]}},bound:any) {
    console.log('aaaaaaaaaaaaaaa');
    
    this.satelliteService.getPolyGonData(payload).subscribe({
      next: (resp) => {
        this.polygon_wkt = resp?.data?.wkt_polygon
        console.log("resp:resp:resp:resp:resp: ", resp?.data);
        if(resp?.data?.area>=100000000){
          this.openSnackbar("Select a smaller polygon");
          
          
        }else {
          if (this.startDate === '' && this.endDate === '') {
            // Start of the previous day
            this.startDate = dayjs().utc().subtract(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');
            
            // End of the previous day
            this.endDate = dayjs().utc().subtract(1, 'day').endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');
            
            console.log(this.endDate, 'Previous day end date and time');
          }
          let queryParams ={
            page_number: '1',
      page_size: '100',
      start_date:this.startDate,
      end_date: this.endDate
          }
          this.data = resp?.data;
          this.getDataUsingPolygon(resp?.data,queryParams)};
      },
      error: (err) => {
        console.log("err: ", err);
      },
    });
  }


  //Polygon data getting by using polygon fucntionality
  getDataUsingPolygon(payload: any,queryParams: any) {
    this.satelliteService.getDataFromPolygon(payload,queryParams).subscribe({
      next: (resp) => {
        this.extraShapesLayer?.clearLayers();
        if (Array.isArray(resp?.data)) {
          resp.data.forEach((item:any) => {
            this.addPolygonWithMetadata(item);
          });
          if(!this.isDrawerOpen){
            this.isDrawerOpen = true
             this.type = 'library'
            this.toggleDrawer()
           
            

  // Find the .leaflet-interactive element
  
            // this.type === 'library'? this.parentZoomLevel = 5: this.parentZoomLevel=4;
            // this.onZoomLevelChange(this.parentZoomLevel)
          } else if (this.type === 'library'){
            console.log('yyyyyyyyyyyyyy');
            
            this.isDrawerOpen = true
            this.drawer._animationState = 'open'
            this.type = 'library'
           this.toggleDrawer()
           this.cdr.detectChanges();
          }
          setTimeout(() => {
       
            if(this.drawer?._animationState === 'open'){
              const mapContainer = this.mapContainer.nativeElement;
             console.log("Map viewport width:", this.map.getSize());
             const containerElement = this.mapContainer.nativeElement;
             containerElement.style.marginLeft = '820px'
             const interactiveElement = mapContainer.querySelector('.leaflet-interactive');
             console.log(interactiveElement,'interactiveElementinteractiveElementinteractiveElementinteractiveElement');
             const mapViewportWidth = containerElement.offsetWidth;
             // Get the width if the element exists
             if (interactiveElement && mapViewportWidth) {
               const width = interactiveElement.getBoundingClientRect().width; // Or use interactiveElement.offsetWidth
               console.log('Width of leaflet-interactive:', width);
             const  marginLeft = mapViewportWidth - width;
             this.leftMargin = marginLeft <0 ? 0: marginLeft
             containerElement.style.marginLeft = marginLeft >= 403 ?`${marginLeft}px`: '403px';
             }
               // Get element width
               
       
               // Get computed styles
               console.log('Map viewport width:', mapViewportWidth);
               
           }
           }, 800);
          
        }
      },
      error: (err) => {
        console.log("err getPolyGonData: ", err);
      },
    });
  }
  // Function to add the polygon and its metadata
  private addPolygonWithMetadata(data: any): void {
    const polygonCoordinates = data.coordinates_record.coordinates[0]; // Access the first array of coordinates
  
    // Convert [lng, lat] to [lat, lng] (Leaflet requires [lat, lng] format)
    const latLngs = polygonCoordinates.map((coord: [number, number]) => [
        coord[1],
        coord[0],
    ]);
  
    let color = 'rgba(239, 242, 77, 0.8)'; // Default color with 50% opacity
if (data.vendor_name === 'planet') {
    color = 'rgba(85, 255, 0, 0.8)'; // Green with 50% opacity
} else if (data.vendor_name === 'blacksky') {
    color = 'rgba(255, 255, 0, 0.8)'; // Yellow with 50% opacity
} else if (data.vendor_name === 'maxar') {
    color = 'rgba(255, 170, 0, 0.8)'; // Orange with 50% opacity
} else if (data.vendor_name === 'airbus') {
    color = 'rgba(0, 112, 255, 0.8)'; // Blue with 50% opacity
} else if (data.vendor_name === 'skyfi') {
    color = 'rgba(169, 0, 230, 0.8)'; // Purple with 50% opacity
} else {
    color = 'rgba(255, 0, 197, 0.8)'; // Pink with 50% opacity
}

    
  
    // Add the polygon to the map
    const polygon = L.polygon(latLngs, {
        color: color, // Border color
        fillColor: color, // Fill color
        fillOpacity: 0.1, // Fill opacity
        weight:1
    }).addTo(this.map);
    console.log(polygon, 'Polygon added');
  
    // Attach the click event to open the component dialog
    polygon.on('click', (event: L.LeafletMouseEvent) => {
        const clickedPosition = event.latlng; // Get the clicked position
  
        // Convert clicked position to pixel position relative to the map
        const containerPoint = this.map.latLngToContainerPoint(clickedPosition);
        let queryParams = {
            page_number: '1',
            page_size: '100',
            start_date: '',
            end_date: '',
            vendor_id: data.vendor_id
        };
        this.satelliteService.getDataFromPolygon('', queryParams).subscribe({
            next: (resp) => {
                console.log(resp, 'Data received');
                const vendorData = resp.data[0];
                this.openDialogAtPosition(polygon, vendorData);
            },
            error: (err) => {
                console.error("Error fetching polygon data: ", err);
            },
        });
        
    });
  
    // Add the polygon to the extra shapes layer
    this.extraShapesLayer?.addLayer(polygon);
  
    // Explicitly disable the draw handler
    if (this.drawHandler && this.drawHandler._toolbars && this.drawHandler._toolbars.draw) {
        this.drawHandler._toolbars.draw.disable(); // Disables drawing
    }
  
    console.log('Drawing tools disabled');
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
    console.log('Received data from child:', data);
  
    // if (this.type === data && this.isDrawerOpen) {
    //   // If the clicked type is the same as the current one and the drawer is already open, do nothing
    //   return;
    // }
    // Update the type to switch the drawer's content
    console.log(this.type,'switch');
    
  if(this.type !== data){
    this.type = data;
    console.log(this.type,'typetypetypetypetype');
    
    this.isDrawerOpen = true;
    
      this.toggleDrawer()

  }else{
    this.type = ''
    this.toggleDrawer();
    this.isDrawerOpen = false;
  }
    // Ensure the drawer stays open
  }

   //Handles various button actions.
   //* @param action - The type of action to perform.

// Handle user actions with toggle and cleanup
handleAction(action: string): void {
  this.drawLayer.clearLayers();
  if (this.drawHandler && this.drawHandler.enabled()) {
    this.drawHandler.disable(); // Disable the drawing tool
    if (this.drawLayer) {
      this.drawLayer.clearLayers(); // Clear any drawn shapes
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

      const  payload= {
        latitude:clickLat,
        longitude:clickLng,
        distance:1
      }
      this.satelliteService.getPinSelectionAnalytics(payload).subscribe({
        next: (resp) => {
          console.log(resp,'resprespresprespresprespresp');
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
    
                  console.log(newTop,'newTopnewTopnewTopnewTop');
                  
                  // Update dialog position dynamically
                  dialogRef.updatePosition({
                    top: `${newTop}px`,
                    left: `${newLeft}px`,
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
  

  // Enable drawing mode for polygons or lines
  private enableDrawing(shape: string): void {
    // Clear previous layers
    this.drawLayer.clearLayers();
    
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
      console.log('Event triggered: ', shape, new Date().toISOString());
  
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
        // API call to get polygon data
        this.satelliteService.getPolyGonData(payload).subscribe({
          next: (resp) => {
            console.log(resp, 'Polygon Data Response');
            this.polygon_wkt = resp?.data?.wkt_polygon
            const data = { polygon_wkt: resp.data.wkt_polygon };
            if (resp.data) {
              // API call for polygon selection analytics
              this.satelliteService.getPolygonSelectionAnalytics(data).subscribe({
                next: (res) => {
                  console.log(res, 'Polygon Selection Analytics Response');
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
                      this.getAddress(center.lat, center.lng).then((address) => {
                        const dialogRef = this.dialog.open(MapControllersPopupComponent, {
                          width: '320px',
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
    console.log(this.zoomControlEnabled,'zoomControlEnabledzoomControlEnabledzoomControlEnabled');
    
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
    console.log(this.activeDrawTool, 'Disabling drawing tool');

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
  console.log('Start Date:', this.startDate);
  console.log('End Date:', this.endDate);

  if (this.data) {
    let queryParams ={
      page_number: '1',
      page_size: '100',
      start_date:this.startDate,
      end_date: this.endDate
    }
  this.getDataUsingPolygon(this.data,queryParams);
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
  console.log('aaaaaaaaaa');
  
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
    console.log(polygonPoint.y,'polygonPointpolygonPointpolygonPointpolygonPointpolygonPoint',mapContainer.offsetTop);
    
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
          console.log(polygonPoint.y,'kkkkkkkkkkk',mapContainer.offsetTop);
          
          newTop = polygonPoint.y + mapContainer.offsetTop ;
        } else if (spaceAbove >= dialogHeight + 20) {
          console.log('bbbbbbbbbbbb');
          
          newTop = polygonPoint.y + mapContainer.offsetTop - dialogHeight - 40;
        } else {
          console.log('ttttttttttttt');
          
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
    console.log('Dialog closed', result);
  });
}

receiveData(dataArray: any[]) {
  console.log(dataArray, 'parentparentparentparentparentparentparent');

  // Track existing image overlays
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

  // Check if the data array is valid and has coordinates
  if (dataArray && dataArray.length > 0) {
    const allBounds: L.LatLngBounds[] = [];

    dataArray.forEach((data) => {
      if (data?.coordinates_record?.coordinates) {
        // Extract the coordinates and map them to Leaflet's LatLng format
        const coordinates = data.coordinates_record.coordinates[0].map((coord: number[]) =>
          new L.LatLng(coord[1], coord[0]) // Convert [lon, lat] to [lat, lon]
        );

        // Create bounds for the current image
        const bounds = L.latLngBounds(coordinates);
        allBounds.push(bounds);

        // Check if the image overlay already exists
        if (!this.imageOverlays.has(data.presigned_url)) {
          // Add the image overlay to the map
          const imageOverlay = L.imageOverlay(data.presigned_url, bounds, {
            opacity: 1, // Optional: Adjust opacity if needed
            zIndex: 1000,
          });
          imageOverlay.addTo(this.map);

          // Store the overlay in the map for tracking
          this.imageOverlays.set(data.presigned_url, imageOverlay);
        } else {
          // Update the bounds of the existing overlay if necessary
          // const existingOverlay = this.imageOverlays.get(data.presigned_url);
          // if (existingOverlay) {
          //   existingOverlay.setBounds(bounds);
          // }
        }
      }
    });

    // Combine all bounds into one
    // const combinedBounds = allBounds.reduce((acc, bounds) => acc.extend(bounds), L.latLngBounds([]));

    // // Get the center of the combined bounds
    // const center = combinedBounds.getCenter();

    // // Set the map view to the center without changing the zoom level
    // const currentZoom = this.map.getZoom();
    // this.map.setView(center, currentZoom); // Retain the current zoom
  } else {
    // Handle case where there are no valid coordinates
    this.imageOverlays.forEach((overlay) => this.map.removeLayer(overlay));
    this.imageOverlays.clear();
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
  const remainingHeight = viewportHeight - totalHeight;

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
  console.log(data, 'highLightShape');

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

  // Extract the coordinates and map them to Leaflet's LatLng format
  const coordinates = data.coordinates_record.coordinates[0].map((coord: number[]) =>
    new L.LatLng(coord[1], coord[0]) // Convert [lon, lat] to [lat, lon]
  );

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
      color = '#FF00C5';
      break;
  }

  // Create a new polygon
  this.highlightedPolygon = L.polygon(coordinates, {
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
  if (!this.polygon || !this.map) {
    console.error('Draw layer or map is not initialized.');
    return;
  }
  let drawLayerBounds
 
  const newBounds = this.drawLayer.getBounds()
  const newEast = newBounds.getNorthEast()
  if(newEast){
// Get the bounds of the drawn shapes
  drawLayerBounds = this.drawLayer?.getBounds();
  } else  {
// Get the bounds of the drawn shapes
  drawLayerBounds = this.polygon.getBounds();
  }

  

  // Ensure drawLayerBounds is valid
  if (!drawLayerBounds || !drawLayerBounds.isValid()) {
    console.error('Draw layer bounds are invalid or empty.');
    return;
  }

  if (this.shapeType) {
    this.shapeType = null;
    return;
  }

  // Get the visible map bounds
  const visibleBounds = this.map.getBounds();

  // Ensure visibleBounds is valid
  if (!visibleBounds || !visibleBounds.isValid()) {
    console.error('Visible map bounds are invalid or empty.');
    return;
  }

  // Calculate the intersection of drawLayerBounds and visibleBounds
  const intersectionBounds = this.getIntersectionBounds(visibleBounds, drawLayerBounds);

  if (intersectionBounds) {
    // Construct WKT manually for the intersection bounds
    const wkt = this.boundsToWKT(intersectionBounds);

    // Compare wkt with this.polygon_wkt
    if (this.isWktGreater(wkt, this.polygon_wkt)) {
      // Log the WKT string of the visible polygon
      this.zoomed_wkt_polygon = '';
    } else {
      this.zoomed_wkt_polygon = wkt; // Return empty string if not greater
    }
    this.cdr.detectChanges();
  } else {
   
  }
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
  console.log(area1,'area1area1area1area1area1area1area1', area2);
  
  return area1 > area2;
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

}
