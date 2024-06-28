import { Injectable } from '@angular/core';

import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';

import { Observable } from 'rxjs';
import { User } from '../domain/entities';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private api_url = environment.accountUrl;
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: HttpClient) { }

  findUser(username: string): Observable<User[]> {
    const url = `${this.api_url}/?username=${username}`;
    console.log(url);
    return this.http.get<User[]>(url);
              // .subscribe(res => {
              //   let users = res as User[];
              //   return (users.length>0)?users[0]:null;
              // }, (error: HttpErrorResponse) => this.handleError(error.message)
              // );
  }

  addUser(user: User): Observable<User>{
    return this.http.post<User>(this.api_url, JSON.stringify(user), {headers: new HttpHeaders({ 'Content-Type': 'application/json' })});
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}