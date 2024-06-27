import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { GlobalStateService } from '../services/global-state.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {
  title = 'ChatBot';

  isOpen = false;

  constructor(private globalStateService: GlobalStateService) {
    this.globalStateService.isOpen$.subscribe((state: boolean) => {
      this.isOpen = state;
    });
  }

  setIsOpen() {
    this.globalStateService.setIsOpen();
  }
}
