import { inject, Injectable } from '@angular/core';
import * as L from 'leaflet';
import { SatelliteService } from './satellite.service';

@Injectable({
  providedIn: 'root'
})
export class WmtsService {
  private TOKEN = ""; // Replace with your actual token


  setWMTSToken(token) {
    this.TOKEN = token;
  }
  async fetchWMTSInfo(imageId: string): Promise<{ layerId: string; tileMatrixSet: string; tileUrlTemplate: string } | null> {
    try {
      const  WMTS_URL = `https://access.foundation.api.oneatlas.airbus.com/api/v1/items/${imageId}/wmts`;
      const response = await fetch(`${WMTS_URL}?request=GetCapabilities`, {
        headers: { "Authorization": `Bearer ${this.TOKEN}` }
      });
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "application/xml");

      const layerId = xmlDoc.querySelector("Layer > Identifier")?.textContent || '';
      const tileMatrixSet = xmlDoc.querySelector("TileMatrixSet > Identifier")?.textContent || '';
      const resourceUrl = xmlDoc.querySelector("ResourceURL[resourceType='tile']");
      const tileUrlTemplate = resourceUrl ? resourceUrl.getAttribute("template") || '' : '';

      return { layerId, tileMatrixSet, tileUrlTemplate };
    } catch (error) {
      console.error("Error fetching WMTS info:", error);
      return null;
    }
  }

  getToken(): string {
    return this.TOKEN;
  }
}
