import { Component } from '@angular/core';
import { Chat } from '../chat/chat.component';

@Component({
  selector: 'home',
  standalone: true,
  imports: [Chat],
  templateUrl: `./home.component.html`,
})
export class Home {}
