import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalStateService } from '../../../services/global-state.service';

@Component({
  selector: 'finish',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './finish.component.html',
})
export class Finish {
  constructor(public globalStateService: GlobalStateService) {}
}
