import { Injectable, Inject } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot }    from '@angular/router';

@Injectable({
    providedIn: 'root',
  })
export class AuthGuardService implements CanActivate {

  constructor(private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    //取得用户访问的URL
    let url: string = state.url;
    return this.checkLogin(url);
  }
  
  checkLogin(url: string): boolean {
    //如果用户已经登录就放行
    if (localStorage.getItem('userId') !== null) { return true; }
    //否则，存储要访问的URl到本地
    localStorage.setItem('redirectUrl', url);
    //然后导航到登陆页面
    this.router.navigate(['/login']);
    //返回false，取消导航
    return false;
  }
}