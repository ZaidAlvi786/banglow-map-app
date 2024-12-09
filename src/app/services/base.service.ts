import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";

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
    const headers = new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoyMDQ4NzM3NDA3LCJpYXQiOjE3MzMzNzc0MDcsImp0aSI6ImFiM2NlZDZlNTI4MzRlMTdhMjcyOGIzZjY2ZDU4ZjJlIiwidXNlcl9pZCI6MX0.SbZhv67nD5T68FvsercJOrWPje98fppXK22AozfKitc`,
    });

    const params = options?.params
    ? new HttpParams({ fromObject: options.params })
    : undefined;

    const requestOptions = {
      ...options,
      headers,
      params, // Add query parameters to the request options
    };

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
