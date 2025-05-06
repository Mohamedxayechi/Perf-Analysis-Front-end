/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IdentityResult } from '../model/User';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
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

  checkAuth() {
    return this.http.get(`${environment.apiBaseUrl}/check-auth`, {
      withCredentials: true,
    });
  }
  logout() {
    return this.http.post(
      `${environment.apiBaseUrl}/logout`,
      {},
      { withCredentials: true }
    );
  }

  forgotPassword(fromData: any) {
    return this.http.post(`${environment.apiBaseUrl}/forgot-password`, fromData);
  }
  resetPassword(formData:any){
    return this.http.post(`${environment.apiBaseUrl}/reset-password`, formData)
  }
}
