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
  getGroupsWithoutNesting(data: {search:any}): Observable<any> {
    return this.get(createUrl("/get-groups-list-without-nesting"),{
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

  getPolygonCalenderDays(data:any,params:any): Observable<any> {
    return this.post(createUrl("/get-polygon-selection-acquisition-calender-days-frequency"),data,{
      params:params
    })
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

  getParentGroups(data: {group_name:any}): Observable<any> {
    return this.get(createUrl("/get-parent-groups-with-details"),{
      params:data
    });
  }
  getNestedGroup(data: {group_id:any}): Observable<any> {
    return this.get(createUrl("/get-nested-group-and-sites-by-group-id"),{
      params:data
    });
  }

  addGroup(data:any): Observable<any> {
    return this.post(createUrl("/add-group"),data)
  }
  updateGroup(data:any): Observable<any> {
    return this.put(createUrl("/update-group"),data)
  }

  getCollectionHistory(queryParams): Observable<any> {
    return this.get(createUrl("/get-collection-history"),{
      params:queryParams
    });
  }
  removeGroup(queryParams): Observable<any> {
    return this.delete(createUrl("/remove-group-and-its-sites"),{
      params:queryParams
    });
  }
  updateSitesCount(data:any): Observable<any> {
    return this.put(createUrl("/reset-site-updates-count"),data)
  }

setWMTSToken() {
  return this.get(createUrl("/get-airbus-access-token"));
}

getPipelineCollection(queryParams): Observable<any> {
  return this.get(createUrl("/get-pipeline-records-collection-history"),{
    params:queryParams
  });
}

validateIpAddress() {
  return this.get(createUrl("/validate-ip-address"));
}

}