import { HttpParams } from "@angular/common/http";
import { environment } from "../../environments/environment";

export function createUrl(endpoint: string): string {
  return `${environment.API_BASE_URL}${endpoint}`;
}

interface RequestOptions {
  params?: Record<string, string | string[]>; // Key-value pairs for query params
  [key: string]: any; // Other optional properties
}

export function createParams(options: RequestOptions): {
  params?: HttpParams;
  [key: string]: any;
} {
  const params = options?.params
    ? new HttpParams({ fromObject: options.params })
    : undefined;

  const requestOptions = {
    ...options,
    params,
  };

  return requestOptions;
}
