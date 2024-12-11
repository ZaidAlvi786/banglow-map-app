import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
  inject,
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
import { MapControllersPopupComponent } from '../../dailogs/map-controllers-popup/map-controllers-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
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
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @ViewChild('drawer') drawer?: MatDrawer;
  map!: L.Map;
  zoomLevel: number = 2;
  longitude: number = -90;
  latitude: number = 40;
  parentZoomLevel: number = 2
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
    subdomains: 'abc',
  });
  private lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    subdomains: 'abc',
  });
   currentAction: string | null = null; // Tracks the current active action
  private userMarker: L.Marker | null = null; // Store the user marker reference
  private activeDrawTool: L.Draw.Polyline | L.Draw.Polygon | null = null; // Track active drawing tool
  constructor(@Inject(PLATFORM_ID) private platformId: Object,
   private satelliteService:SatelliteService,private dialog: MatDialog,
   private http: HttpClient,
  )
  {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
    }
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
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.latitude, this.longitude],
      zoom: this.zoomLevel,
      zoomControl: false,
      minZoom: 2, // Set minimum zoom level
      maxZoom: 10, // Set maximum zoom level
      scrollWheelZoom: true, // Optionally allow zooming by scrolling
    });
  
    // Set the bounds for the map to restrict panning and zooming
    const bounds: L.LatLngBoundsLiteral = [
      [-90, -180], // South-west corner (latitude, longitude)
      [90, 180],   // North-east corner (latitude, longitude)
    ];
  
    // Set the max bounds for the map
    this.map.setMaxBounds(bounds);
    
    // Optional: Prevent zooming out beyond a certain level
    this.map.on('zoomend', () => {
      if (this.map.getZoom() < 2) {
        this.map.setZoom(2);
      }
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
  
    // Add event listener for zoom changes
    this.map.on('zoomend', () => {
      console.log('Zoom changed');
      this.zoomLevel = this.map.getZoom();
    });
  
    // Add event listener for mouse movement to track coordinates
    this.map.on('mousemove', (event: L.LeafletMouseEvent) => {
      const coords = event.latlng;
      this.longitude = parseFloat(coords.lng.toFixed(6));
      this.latitude = parseFloat(coords.lat.toFixed(6));
    });
  
    // Add event listener for when a shape is created
    this.map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      this.drawLayer.addLayer(layer);
  
      // Optionally handle other types of layers, like storing the GeoJSON of the created feature
      const geoJSON = layer.toGeoJSON();
      console.log('GeoJSON of created feature: ', geoJSON);
    });
  
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
  
          // Temporarily allow zooming to user location
          this.map.setView([lat, lng], 2, { animate: true });
        }
      );
    }
  }
  

  // private addPin(coords: [number, number], iconUrl: string): void {
  //   const customIcon = L.icon({
  //     iconUrl,
  //     iconSize: [25, 41],
  //     iconAnchor: [12, 41],
  //   });

  //   L.marker(coords, { icon: customIcon }).addTo(this.map);
  // }

  private addPin(coords: [number, number], iconUrl: string): void {
    const customIcon = L.icon({
      iconUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    L.marker(coords, { icon: customIcon }).addTo(this.map);
  }

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
  }

  //angular drawer toggle function
  toggleDrawer(): void {
    if (this.drawer) {
      this.drawer.toggle();
    }
  }

  //map shape drawing function
  setDrawType(type: any): void {
    console.log("Selected Draw Type:", type);
    this.currentAction = null
    this.map.off('click')
    // Remove any existing event listeners or drawing layers
    this.map.off(L.Draw.Event.CREATED);
    if (this.markerHandler) {
      this.markerHandler.disable();  // Disable the marker tool
      console.log("Marker tool has been disabled.");
    }

    // Clear any existing shapes from the map
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
        },
      });
    } else if (type === 'Circle') {
      drawHandler = new L.Draw.Circle(this.map as L.DrawMap, {
        shapeOptions: {
          color: '#3399ff',
        },
      });
    } else if (type === 'Box') {
      drawHandler = new L.Draw.Rectangle(this.map as L.DrawMap, {
        shapeOptions: {
          color: '#66cc66',
        },
      });
    }
  
    if (drawHandler) {
      // Start the drawing process immediately
      drawHandler.enable();
  
      // Add an event listener for when the shape is created
      this.map.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer; // The drawn layer
        this.drawLayer.addLayer(layer); // Add to the feature group
  
        console.log("Drawn Layer Type:", event.layerType);
  
        if (event.layerType === 'polygon' && type === 'Polygon') {
          const coordinates = (layer as L.Polygon).getLatLngs();
          console.log('Polygon Coordinates:', type);
          const geoJSON = layer.toGeoJSON();
          const bounds = (layer as L.Polygon).getBounds();
          
          this.getPolygonFromCoordinates({geometry:geoJSON?.geometry},bounds);
        } else if (event.layerType === 'circle' && type ==='Circle') {
          const center = (layer as L.Circle).getLatLng();
          const radius = (layer as L.Circle).getRadius();
          console.log('Circle Center:', center);
          console.log('Circle Radius:', radius);
        } else if (event.layerType === 'rectangle' && type === 'Box') {
          const bounds = (layer as L.Rectangle).getBounds();
          console.log('Rectangle Bounds:', bounds);
          const geoJSON = layer.toGeoJSON();
          this.getPolygonFromCoordinates({geometry:geoJSON?.geometry},bounds);
        }
  
        // Disable the draw handler after the shape is created
        drawHandler.disable();
        type= null
      });
      this.drawHandler = drawHandler;
    } else {
      console.error("Invalid draw type specified.");
    }
  }

  showSatelliteWithinPolygon(bounds: L.LatLngBounds): void {
    // Define the satellite image URL (or any other map layer)
    const satelliteImageUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  
    // Create an image overlay based on the bounds of the polygon
    const imageBounds = bounds; // This is the bounding box of the polygon
    const satelliteLayer = L.imageOverlay(satelliteImageUrl, imageBounds, {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA',
      opacity: 0.6, // Set the opacity as needed
    });
  
    // Add the satellite layer within the polygon bounds
    satelliteLayer.addTo(this.map);
  }

  getPolygonFromCoordinates(payload:{geometry:{type:string,coordinates:any[]}},bound:any) {
    this.satelliteService.getPolyGonData(payload).subscribe({
      next: (resp) => {
        console.log("resp: ", resp?.data);
        if(resp?.data?.area>=100000000){
          this.openSnackbar("Select a smaller polygon");
        }else this.getDataUsingPolygon(resp?.data);
      },
      error: (err) => {
        console.log("err: ", err);
      },
    });
  }



  getDataUsingPolygon(payload: any) {
    this.satelliteService.getDataFromPolygon(payload).subscribe({
      next: (resp) => {
        if (Array.isArray(resp?.data)) {
          resp.data.forEach((item:any) => {
            this.addPolygonWithMetadata(item);
          });
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

    // Add the polygon to the map
    const polygon = L.polygon(latLngs, {
      color: "#eff24d", // Border color
      fillColor: "#eff24d", // Fill color
      fillOpacity: 0.1, // Fill opacity
    }).addTo(this.map);
    this.extraShapesLayer?.addLayer(polygon);  
  }

  private clearExtraShapes(): void {
    this.extraShapesLayer?.clearLayers();
  }

  private openSnackbar(message:string){
    this._snackBar.open(message, 'Ok', {
      duration: 4000  // Snackbar will disappear after 300 milliseconds
    });
  }


  addCatalogMarker(catalogItem: any): void {
    const { latitude, longitude, vendor_name, type, resolution } = catalogItem;
  
    // Ensure valid geographic data exists
    if (!latitude || !longitude) {
      console.warn("Invalid catalog item, missing coordinates:", catalogItem);
      return;
    }
  
    // Create a marker or another layer type (like a circle)
    const marker = L.marker([latitude, longitude], {
      icon: L.icon({
        iconUrl: 'assets/svg-icons/satellite-icon.svg', // Customize icon if needed
        iconSize: [25, 25], // Adjust size
        iconAnchor: [12, 25], // Anchor point
      }),
    });
  
    // Bind a popup to display catalog details
    marker.bindPopup(`
      <div>
        <strong>Vendor:</strong> ${vendor_name}<br>
        <strong>Type:</strong> ${type}<br>
        <strong>Resolution:</strong> ${resolution}<br>
      </div>
    `);
  
    // Add marker to the map or a specific layer group
    this.vectorLayer.addLayer(marker);
  }
  

  private addDrawingControls(): void {
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: this.drawLayer },
      draw: {
        polygon: {},
        circle: {},
        rectangle: {},
      },
    });

    this.map.addControl(drawControl);

    this.map.on(L.Draw.Event.CREATED, (event:  any) => {
      const layer = event.layer;
      this.drawLayer.addLayer(layer);

      if (event.layerType === 'polygon') {
        console.log('Polygon Coordinates:', (layer as L.Polygon).getLatLngs());
      } else if (event.layerType === 'circle') {
        const circle = layer as L.Circle;
        console.log('Circle Center:', circle.getLatLng());
        console.log('Circle Radius:', circle.getRadius());
      } else if (event.layerType === 'rectangle') {
        console.log('Rectangle Bounds:', (layer as L.Rectangle).getBounds());
      }
    });
  }

  handleToggleEvent(data: string): void {
    console.log('Received data from child:', data);
    this.type = data;
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
      
        // Fetch address and open the dialog
        this.getAddress(clickLat, clickLng).then((address) => {
          const dialogRef = this.dialog.open(MapControllersPopupComponent, {
            width: '320px',
            data: { type: 'marker', address },
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
      });
      
    });
  }
  
  
  
  
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
    // Clear existing shapes before enabling the drawing tool
    this.drawLayer.clearLayers();
  
    let drawTool: L.Draw.Polyline | L.Draw.Polygon;

    // Create the appropriate drawing tool based on the selected shape
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
            // Restricting line to only two points
            maxPoints: 2,
        });
    } else {
        console.error('Invalid shape type');
        return;
    }

    // Enable the drawing tool
    drawTool.enable();

    // Store the active drawing tool
    this.activeDrawTool = drawTool;

    // Listen to the created event
    this.map.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;

        // Handle the created shapes
        if (shape === 'line' && layer instanceof L.Polyline) {
            const latlngs = layer.getLatLngs();
            if (latlngs.length === 2) {
                console.log('Line drawn successfully between two points:', latlngs);
                this.drawLayer.addLayer(layer);
            }
        } else if (shape === 'polygon') {
            this.drawLayer.addLayer(layer);
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
  this.map.options.maxZoom = 10;

  // Optionally reset the zoom level to your default zoom
  if (this.zoomLevel > 10) {
    this.map.setZoom(10); // Adjust zoom if it exceeds maxZoom
  }
}


//open map controller pop up
openDialog(data: any, position: { top: string; left: string }): void {
  this.dialog.open(MapControllersPopupComponent, {
    width: '300px',
    data: data,
    position: position, // Dynamically calculated position
  });
}
}
