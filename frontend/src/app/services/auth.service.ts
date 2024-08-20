import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<any>(`${environment.apiUrl}/user/login`, { username, password }).pipe(
      tap((res) => {
        console.log(res.message);
        localStorage.setItem('username', username);
      }),
    );
  }

  register(username: string, password: string) {
    return this.http.post<any>(`${environment.apiUrl}/user/register`, { username, password }).pipe(
      tap((res) => {
        console.log(res.message);
      }),
    );
  }

  isLoggedIn() {
    return Boolean(localStorage.getItem('username'));
  }

  logout() {
    localStorage.removeItem('username');
  }

  getUsername() {
    return localStorage.getItem('username');
  }
}
