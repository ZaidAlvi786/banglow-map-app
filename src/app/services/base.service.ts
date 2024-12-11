import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { createParams } from "../customFIles/shared-function";

@Injectable({
  providedIn: "root",
})
export class BaseService {
  constructor(private http: HttpClient) {}

  headers = new HttpHeaders({
    "Content-Type": "application/json",
    Authorization: "Bearer your-token-goes-here", // Replace with your token or logic to fetch it
  });

  get(url: string, options?: object): Observable<any> {
    return this.http.get<any>(url, options);
  }

  post(url: string, model: any = {}, options?: any): Observable<any> {
    const requestOptions= createParams(options);
    return this.http.post<any>(url, model, requestOptions);
  }

  put(url: string, model: any = {}, options?: any): Observable<any> {
    return this.http.put<any>(url, model, options);
  }

  patch(url: string, model: any, options?: any): Observable<any> {
    return this.http.patch<any>(url, model, options);
  }

  delete(url: string, options?: any): Observable<any> {
    return this.http.delete<any>(url, options);
  }
}
