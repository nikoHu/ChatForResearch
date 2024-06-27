import { Component } from '@angular/core';
import { Chat } from '../chat/chat.component';


@Component({
  selector: 'studio',
  standalone: true,
  imports: [Chat],
  templateUrl: './studio.component.html',
})
export class Studio {}
