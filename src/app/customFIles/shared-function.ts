import { environment } from "../../environments/environment";

export function createUrl(endpoint: string): string {
  return `${environment.API_BASE_URL}${endpoint}`;
}
