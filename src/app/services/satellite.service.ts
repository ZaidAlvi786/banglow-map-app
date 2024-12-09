import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { HttpClient } from "@angular/common/http";
import { createUrl } from "../customFIles/shared-function";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SatelliteService extends BaseService {
  constructor(public _http: HttpClient) {
    super(_http);
  }

  getPolyGonData(model: any): Observable<any> {
    return this.post(createUrl("/geojson-to-wkt"), model);
  }

  getDataFromPolygon(data:any){
    const queryParams = {
      page_number: '1',
      page_size: '100',
      start_date:'2024-11-01T00:00:00.000000Z'
    };
    return this.post(createUrl("/satellite-catalog"), data,{
      params: queryParams, // Pass query parameters here
    });
  }


}
