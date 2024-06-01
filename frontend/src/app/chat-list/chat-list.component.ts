import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'chat-list',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './chat-list.component.html',
})
export class ChatList {
  chats = [
    { id: '1', name: 'Chat 1' },
    { id: '2', name: 'Chat 2' },
  ];

  activeChatId = '';

  setActive(id: string) {
    this.activeChatId = id;
  }

  isActive(id: string) {
    return this.activeChatId === id;
  }
}
