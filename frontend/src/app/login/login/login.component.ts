import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Auth, User } from '../../domain/entities';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  auth: Auth = new Auth();
  username = ''
  password = ''

  constructor(private router: Router, private service : AuthService){

  }

  onClickLogin(){
    console.log("click login", this.username, this.password);
    this.service
      .loginWithCredentials(this.username, this.password)
      .subscribe((auth: Auth) => {
        console.log(auth);
        // let redirectUrl = (auth.redirectUrl === null)? '/': auth.redirectUrl;
        this.auth = Object.assign({}, auth);
        if (!auth.hasError) {
          this.router.navigate(['home']);
        }
      });
  }

}
