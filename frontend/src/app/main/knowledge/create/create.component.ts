import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { GlobalStateService } from '../../../services/global-state.service';

@Component({
  selector: 'create',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './create.component.html',
})
export class Create {
  constructor(
    private router: Router,
    public globalStateService: GlobalStateService,
  ) {}

  goBack() {
    this.globalStateService.steps = [false, false];
    this.router.navigate(['/knowledge']);
  }
}
