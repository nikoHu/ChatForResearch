import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { GlobalStateService } from '../../../services/global-state.service';

@Component({
  selector: 'finish',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './finish.component.html',
})
export class Finish {
  constructor(
    private router: Router,
    public globalStateService: GlobalStateService,
  ) {}

  next() {
    this.globalStateService.steps = [false, false];
    this.router.navigate([`/knowledge/${this.globalStateService.knowledgeName}/files`]);
  }
}
