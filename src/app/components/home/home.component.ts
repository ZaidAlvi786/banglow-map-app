import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
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
import 'leaflet-draw/dist/leaflet.draw.css';
import { HttpClient } from '@angular/common/http';


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
  zoomLevel: number = 2.5;
  longitude: number = -90;
  latitude: number = 40;
  drawLayer!: L.FeatureGroup;
  vectorLayer!: L.LayerGroup;
  type: string = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object,private http: HttpClient) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
    }
  }

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

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.latitude, this.longitude],
      zoom: this.zoomLevel,
      zoomControl: false,
    });

    // Add Tile Layer (Dark mode basemap)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abc',
    }).addTo(this.map);

    // Initialize the drawing layer
    this.drawLayer = new L.FeatureGroup();
    this.map.addLayer(this.drawLayer);

    // Initialize and add the vector layer
    this.vectorLayer = L.layerGroup();
    this.vectorLayer.addTo(this.map);

    // Add a custom marker
    // this.addPin([this.latitude, this.longitude], 'assets/svg-icons/pin-location-icon.svg');

    // Add event listener for zoom changes
    this.map.on('zoomend', () => {
      this.zoomLevel = this.map.getZoom();
    });

    // Add event listener for mouse movement to track coordinates
    this.map.on('mousemove', (event: L.LeafletMouseEvent) => {
      const coords = event.latlng;
      this.longitude = parseFloat(coords.lng.toFixed(6));
      this.latitude = parseFloat(coords.lat.toFixed(6));
    });

    // Initialize Leaflet Draw control
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: this.drawLayer,
      },
    });

    // Add the drawing control to the map
    this.map.addControl(drawControl);

    // Add event listener for when a shape is created
    this.map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      this.drawLayer.addLayer(layer);

      // Optionally handle other types of layers, like storing the GeoJSON of the created feature
      const geoJSON = layer.toGeoJSON();
      console.log('GeoJSON of created feature: ', geoJSON);
    });
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

  zoomIn(): void {
    const currentZoom = this.map.getZoom();
    if (currentZoom < this.map.getMaxZoom()) {
      this.map.setZoom(currentZoom + 1);
    }
  }

  zoomOut(): void {
    const currentZoom = this.map.getZoom();
    if (currentZoom > this.map.getMinZoom()) {
      this.map.setZoom(currentZoom - 1);
    }
  }

  toggleDrawer(): void {
    if (this.drawer) {
      this.drawer.toggle();
    }
  }

  setDrawType(type: 'Polygon' | 'Circle' | 'Box'): void {
    console.log("typetypetype", type);
    
    const drawOptions: Partial<L.Control.DrawOptions> = {
      polygon: false,
      circle: false,
      rectangle: false,
    };

    if (type === 'Polygon') {
      drawOptions.polygon = {}; // Enable Polygon with default options
    } else if (type === 'Circle') {
      drawOptions.circle = {}; // Enable Circle with default options
    } else if (type === 'Box') {
      drawOptions.rectangle = {}; // Enable Rectangle with default options
    }

    const drawControl = new L.Control.Draw({
      edit: { featureGroup: this.drawLayer },
      draw: drawOptions as L.Control.DrawOptions,
    });

    this.map.eachLayer((layer) => {
      if (layer instanceof L.Control) {
        this.map.removeControl(layer);
      }
    });

    this.map.addControl(drawControl);

    this.map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer; // The drawn layer
      this.drawLayer.addLayer(layer);

      console.log("event.layerTypeevent.layerTypeevent.layerType", event.layerType);
      
    
      if (event.layerType === 'polygon') {
        const coordinates = (layer as L.Polygon).getLatLngs();
        console.log('Polygon Coordinates:', coordinates);
      } else if (event.layerType === 'circle') {
        const center = (layer as L.Circle).getLatLng();
        const radius = (layer as L.Circle).getRadius();
        console.log('Circle Center:', center);
        console.log('Circle Radius:', radius);
      } else if (event.layerType === 'rectangle') {
        const bounds = (layer as L.Rectangle).getBounds();
        console.log('Rectangle Bounds:', bounds);
      }
    });
    
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
}
