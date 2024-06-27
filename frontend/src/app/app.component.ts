import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { GlobalStateService } from './services/global-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: `./app.component.html`,
})
export class AppComponent {
  // title = 'ChatBot';

  // isOpen = false;

  // constructor(private globalStateService: GlobalStateService) {
  //   this.globalStateService.isOpen$.subscribe((state: boolean) => {
  //     this.isOpen = state;
  //   });
  // }

  // setIsOpen() {
  //   this.globalStateService.setIsOpen();
  // }
}
