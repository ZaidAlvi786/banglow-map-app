import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthUtils } from './auth.utils';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Intercept
 *
 * @param req
 * @param next
 */
export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const snackBar = inject(MatSnackBar);
    // Clone the request object
    let newReq = req.clone();

    // Request
    //
    // If the access token didn't expire, add the Authorization header.
    // We won't add the Authorization header if the access token expired.
    // This will force the server to return a "401 Unauthorized" response
    // for the protected API routes which our response interceptor will
    // catch and delete the access token from the local storage while logging
    // the user out from the app.
    if (authService.accessToken && !AuthUtils.isTokenExpired(authService.accessToken)) {
        newReq = req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + authService.accessToken),
        });
    }

    // Response
    return next(newReq).pipe(
        catchError((err) => {

            if (err instanceof HttpErrorResponse) {
                if (err.status === 401) {
                    authService.signOut();
                    snackBar.open('Session expired. Please log in again.', 'Close', {
                        duration: 3000, // Snackbar duration in milliseconds
                        verticalPosition: 'top', // Position the snackbar at the top
                    });
                } else { 
                    snackBar.open(`${err.error.error || err.error.data}`, 'Close', {
                        duration: 3000,
                        verticalPosition: 'top',
                    });
                }
            } else {
                snackBar.open('An unexpected error occurred.', 'Close', {
                    duration: 3000,
                    verticalPosition: 'top',
                });
            }
            return throwError(err);
        }),
    );
};



