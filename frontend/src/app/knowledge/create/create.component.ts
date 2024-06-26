import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'create',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './create.component.html',
})
export class Create {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/knowledge']);
  }
}
