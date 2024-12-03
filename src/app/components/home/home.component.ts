import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Inject, PLATFORM_ID  } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import { fromLonLat, toLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import Draw, { createBox } from 'ol/interaction/Draw';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Polygon, Circle as CircleGeometry, Point } from 'ol/geom';
import { Style, Fill, Stroke, Icon } from 'ol/style';
import { ZoomSlider } from 'ol/control';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import {MatDrawer, MatSidenavModule} from '@angular/material/sidenav';
import { SidebarDrawerComponent } from '../sidebar-drawer/sidebar-drawer.component';
import Feature from 'ol/Feature';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FooterComponent, MatFormFieldModule, FormsModule, ReactiveFormsModule, MatInput,HeaderComponent,MatSidenavModule,SidebarDrawerComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;
  map!: Map;
  draw: Draw | null = null;
  source: VectorSource;
  vectorLayer: VectorLayer;
  longitude: any;
  latitude: any;
  view!: View;
  zoomLevel: number = 2;
  type:string=''
  @ViewChild('drawer') drawer?: MatDrawer;
constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.source = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.source,
      style: this.getDefaultStyle()
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
    this.initMap();
    }
  }

  handleToggleEvent(data: string) {
    console.log('Received data from child:', data);
    this.type = data;
  }

  toggleDrawer() {
    
    if(this.drawer){
      console.log('sssssssss');
      this.drawer.toggle();
    }
    
  }
  initMap(): void {
    this.view = new View({
      center: fromLonLat([-90, 40]),
      zoom: 1,
    });

    this.map = new Map({
      target: this.mapContainer.nativeElement,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          }),
        }),
        this.vectorLayer,  // Ensure vector layer is added to the map
      ],
      view: this.view,
      controls: defaultControls({
        zoom: false,
        attribution: false
      }).extend([new ZoomSlider()]),  // Add the ZoomSlider control
    });

    this.map.getView().on('change:resolution', () => {
      this.zoomLevel = this.getZoomLevel();
      console.log(this.zoomLevel, 'zoomLevel');
    });

    this.map.on('pointermove', (event) => {
      const coords = toLonLat(event.coordinate);
      this.longitude = parseFloat(coords[0].toFixed(6));
      this.latitude = parseFloat(coords[1].toFixed(6));
    });
    this.addPin([40, -90], 'assets/svg-icons/pin-location-icon.svg'); 
  }

  getZoomLevel(): number {
    const currentZoom = this.view.getZoom();
    return currentZoom !== undefined ? Math.round(currentZoom) : 0;
  }

  addPin(coordinates: [number, number], iconPath: string): void {
    // Convert the coordinates to LonLat and then to the map projection
    console.log('tttttttttttttttttttttttt',iconPath);
    
    const pinLocation = fromLonLat(coordinates);

    // Create the Point feature for the pin
    const pinFeature = new Feature({
      geometry: new Point(pinLocation),
    });

    // Set the icon style for the pin
    pinFeature.setStyle(new Style({
      image: new Icon({
        src: iconPath,  // Path to your icon
        scale: 0.1,  // Adjust scale as needed
      }),
      zIndex: 1000
    }));

    // Add the pin feature to the vector source
    this.source.addFeature(pinFeature);

    // Add click event listener on the map to detect if the pin is clicked
    this.map.on('click', (event) => {
      const feature = this.map.forEachFeatureAtPixel(event.pixel, (feat) => feat);
      if (feature === pinFeature) {
        this.openDialog();
      }
    });
  }

  openDialog(): void {
    // Open the dialog or perform any actions when the pin is clicked
    console.log('Pin clicked!');
    // this.dialog.open(PinDialogComponent);
  }

  getDefaultStyle() {
    return new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.1)',  // Semi-transparent blue fill
      }),
      stroke: new Stroke({
        color: '#ffffff',  // Bright blue stroke color
        width: 1,
      }),
    });
  }

  addDrawingInteraction(type: 'Polygon' | 'Circle' | 'Box'): void {
    if (this.draw) return;

    let geometryFunction: any = null;
    let drawType: any = type;

    if (drawType === 'Box') {
      drawType = 'Circle';
      geometryFunction = createBox();
    }

    this.draw = new Draw({
      source: this.source,
      type: drawType,
      style: this.getDefaultStyle(),
      geometryFunction: geometryFunction,
      maxPoints: type === 'Polygon' ? 7 : undefined
    });

    this.map.addInteraction(this.draw);

    this.draw.on('drawend', (event: any) => {
      const feature = event.feature;
      const geometry = feature.getGeometry();
    
      if (geometry instanceof Polygon) {
        const coordinates = geometry.getCoordinates();
        const area = geometry.getArea();
        console.log('Polygon Coordinates:', coordinates);
        console.log('Polygon Area:', area);
      } else if (geometry instanceof CircleGeometry) {
        const center = geometry.getCenter();
        const radius = geometry.getRadius();
        console.log('Circle Center:', center);
        console.log('Circle Radius:', radius);
      }
    
      // Remove the draw interaction after drawing is complete
      this.map.removeInteraction(this.draw!);
      this.draw = null;
    });
  }

  setDrawType(type: 'Polygon' | 'Circle' | 'Box'): void {
    this.addDrawingInteraction(type);
  }

  zoomIn(): void {
    const currentZoom = this.view.getZoom();
    if (currentZoom !== undefined && currentZoom < 10) {
      this.view.setZoom(currentZoom + 1);
    }
  }

  zoomOut(): void {
    const currentZoom = this.view.getZoom();
    if (currentZoom !== undefined) {
      this.view.setZoom(currentZoom - 1);
    }
  }
}
