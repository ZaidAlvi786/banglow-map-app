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

  getDataFromPolygon(data:any,queryParams:{page_number:string;page_size:string;start_date:string,end_date:string}){
    return this.post(createUrl("/satellite-catalog"), data,{
      params: queryParams, // Pass query parameters here
    });
  }


}
