import { Injectable, Inject } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';

import { ReplaySubject, Observable, of } from 'rxjs';
import { defaultIfEmpty, map, switchMap } from 'rxjs/operators';

import { User } from '../domain/entities';
import { Auth } from '../domain/entities';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  auth: Auth = {hasError: true, redirectUrl: '', errMsg: 'not logged in', user: new User()};

  subject: ReplaySubject<Auth> = new ReplaySubject<Auth>(1);

  constructor(private http: HttpClient, private userService: UserService) { }

  loginWithCredentials(username: string, password: string): Observable<Auth> {
    return this.userService
      .findUser(username).pipe(
        map((user: User[]) => {
          const auth = new Auth();
          console.log(user);
          console.log(localStorage);
          localStorage.removeItem('userId');
          const loginUser: any= (user.length > 0) ? user[0] : null;
          if (user.length == 0) {
            auth.user = null;
            auth.hasError = true;
            auth.errMsg = 'user not found';
          } else if (password === loginUser.password) {
            auth.user = loginUser;
            auth.hasError = false;
            auth.errMsg = null;
            
            localStorage.setItem('userId', loginUser.id);
          } else {
            auth.user = null;
            auth.hasError = true;
            auth.errMsg = 'password not match';
          }
          this.auth = Object.assign({}, auth);
          this.subject.next(this.auth);
          return this.auth;
        })
      );
  }

  register(username: string, password: string): Observable<Auth> {
    let toAddUser: User = {
      id:0,
      username: username,
      password: password
    };
    return this.userService
                .findUser(username)
                .pipe(
                  // defaultIfEmpty(User[] | null),
                  switchMap((users: User[]) => {
                    if (users.length !== 0) {
                      console.log(typeof(users));
                      console.log("user existes");
                      return of(this.auth);
                    } else {
                      return this.userService.addUser(toAddUser).pipe(
                        map(u => {
                          this.auth = Object.assign(
                            {},
                            { user: u as User, hasError: false, errMsg: null, redirectUrl: ''}
                          );
                          this.subject.next(this.auth);
                          return this.auth;
                        })
                      );
                    }
                  })
                  );

  }


  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}