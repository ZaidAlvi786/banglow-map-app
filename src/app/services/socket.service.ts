import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject, timer, throwError, EMPTY } from 'rxjs';
import { catchError, delayWhen, tap, take, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket$: WebSocketSubject<any>;
  private connectionAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_DELAY = 2000; // 2 seconds
  private isManuallyDisconnected = false;

  constructor() {
    this.connect();
  }

  private connect(): void {
    const wsUrl = `${environment.SOCKET_URL}?token=${environment.authToken}`;

    this.socket$ = webSocket({
      url: wsUrl,
      deserializer: msg => msg.data ? JSON.parse(msg.data) : msg,
      serializer: msg => JSON.stringify(msg),
      openObserver: {
        next: () => {
          console.log('✅ WebSocket Connected!');
          this.connectionAttempts = 0;
        }
      },
      closeObserver: {
        next: (event) => {
          console.warn('⚠️ WebSocket Disconnected:', event);
          if (!this.isManuallyDisconnected) {
            this.reconnect();
          }
        }
      }
    });

    // Handle errors and reconnection logic
    this.socket$
      .pipe(
        catchError((error) => {
          console.error('❌ WebSocket Error:', error);
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  private reconnect(): void {
    if (this.connectionAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.connectionAttempts++;
      console.log(`🔄 Attempting to reconnect (#${this.connectionAttempts})...`);

      timer(this.RECONNECT_DELAY)
        .pipe(
          take(1),
          tap(() => this.connect())
        )
        .subscribe();
    } else {
      console.error('🚫 Max reconnection attempts reached.');
    }
  }

  sendMessage(message: any): void {
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.next(message);
    } else {
      console.warn('⚠️ Cannot send message: WebSocket is disconnected.');
    }
  }

  getMessages(): Observable<any> {
    return this.socket$.pipe(
      catchError((error) => {
        console.error('❌ Error receiving message:', error);
        return EMPTY;
      })
    );
  }

  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.socket$.complete();
    console.log('🔌 WebSocket Manually Disconnected!');
  }
}
