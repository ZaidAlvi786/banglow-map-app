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

  getPinSelectionAnalytics(data: any): Observable<any> {
    return this.post(createUrl("/get-pin-selection-analytics"), data);
  }
  getPolygonSelectionAnalytics(data: any): Observable<any> {
    return this.post(createUrl("/get-polygon-selection-analytics"), data);
  }
  getGroupsForAssignment(data: {group_name:any}): Observable<any> {
    return this.get(createUrl("/get-groups-for-assignment-and-searching"),{
      params:data
    });
  }
  generateCirclePolygon(data: any): Observable<any> {
    return this.post(createUrl("/generate-circle-polygon/"), data);
  }

  addSite(data: any): Observable<any> {
    return this.post(createUrl("/add-site"), data);
  }
  addGroupSite(data: any): Observable<any> {
    return this.post(createUrl("/add-group-site"), data);
  }

  getPolygonCalenderDays(data:any): Observable<any> {
    return this.post(createUrl("/get-polygon-selection-acquisition-calender-days-frequency"),data)
  }
  getSites(data: {name:any,page_number:any,per_page:any}): Observable<any> {
    return this.get(createUrl("/get-sites"),{
      params:data
    });
  }
  updateSite(data:any): Observable<any> {
    return this.put(createUrl("/update-site"),
      data
    );
  }
}