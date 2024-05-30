import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatList } from './chat-list/chat-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChatList, RouterOutlet],
  template: `
    <div class="flex h-screen w-screen flex-row items-center justify-center">
      <chat-list class="h-full w-1/5 min-w-36 border-r bg-black/5"></chat-list>
      <div class="h-full w-full">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
})
export class AppComponent {
  title = 'ChatBot';
}
