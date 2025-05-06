/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IdentityResult } from '../model/User';
import { environment } from '../environments/environment';
import { BehaviorSubject, catchError, Observable, of, shareReplay, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  authState$ = new BehaviorSubject<any>(null);
  constructor(private http: HttpClient) {}

  createUser(formData: any) {
    return this.http.post<IdentityResult>(
      environment.apiBaseUrl + '/signupperinvitation',
      formData
    );
  }

  signin(formData: any) {
    return this.http.post(environment.apiBaseUrl + '/signin', formData, {
      withCredentials: true,
    });
  }

  checkAuth(force = false): Observable<any> {
    if (!force && this.authState$.value) {
      return of(this.authState$.value); 
    }
  
    const req$ = this.http.get(`${environment.apiBaseUrl}/check-auth`, { withCredentials: true }).pipe(
      tap((res) => this.authState$.next(res)),
      shareReplay(1),
      catchError(err => {
        this.authState$.next(null);
        return throwError(() => err);
      })
    );
    return req$;
  }

  get currentAuth() {
    return this.authState$.value;
  }
  logout(): Observable<any> {
    this.authState$.next(null); // Clear cached auth state
    return this.http.post(
      `${environment.apiBaseUrl}/logout`,
      {},
      { withCredentials: true }
    );
  }

  forgotPassword(fromData: any) {
    return this.http.post(
      `${environment.apiBaseUrl}/forgot-password`,
      fromData
    );
  }
  resetPassword(formData: any) {
    return this.http.post(`${environment.apiBaseUrl}/reset-password`, formData);
  }
}
