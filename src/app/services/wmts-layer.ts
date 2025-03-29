import * as L from 'leaflet';


export class WMTSLayer extends L.TileLayer {
    private _url: string;
    private _token: string;
    // private _bounds: L.LatLngBounds;
  
    constructor(url: string, options: any) {
      super(url, options);
      this._url = url;
      this._token = options.token;
      // this._bounds = options.bounds; // Pass bounds as part of options
    }
  
    override createTile(
      coords: L.Coords,
      done: (err: Error | null, tile: HTMLImageElement | null) => void
    ): HTMLImageElement {
      const tile = document.createElement("img");
      const url = this.getTileUrl(coords);
  
      fetch(url, {
        headers: { "Authorization": `Bearer ${this._token}` }
      })
        .then(response => response.blob())
        .then(blob => {
          tile.src = URL.createObjectURL(blob);
          tile.onload = () => done(null, tile);
        })
        .catch(err => done(err, null));
  
      // Adding Mouse Events (like in your image overlay)
      tile.addEventListener("mouseover", () => {
        this.onTileHover(coords); // Define this function to handle hover
      });
  
      tile.addEventListener("mouseout", () => {
        this.onTileOut(coords); // Define this function to handle mouseout
      });
  
      return tile;
    }
  
    override getTileUrl(coords: L.Coords): string {
      // Use the custom `_url` property to generate the tile URL
      const tileMatrix = coords.z.toString();
      const tileCol = coords.x.toString();
      const tileRow = coords.y.toString();
  
      // Optional: Check if the current tile is within the bounds of the map
    //   if (!this._bounds.contains(L.latLng(coords.y, coords.x))) {
    //     return ""; // Return empty URL if tile is out of bounds
    //   }
  
      return this._url
        .replace("{TileMatrix}", tileMatrix)
        .replace("{TileCol}", tileCol)
        .replace("{TileRow}", tileRow);
    }
  
    // Function to handle hover event (onmouseover)
    onTileHover(coords: L.Coords): void {
      console.log("Hovered over tile at coords:", coords);
      // Add your custom behavior for tile hover (e.g., show additional info)
    }
  
    // Function to handle mouse out event (onmouseout)
    onTileOut(coords: L.Coords): void {
      console.log("Mouse left tile at coords:", coords);
      // Add your custom behavior for tile mouseout (e.g., reset style)
    }
  }
  