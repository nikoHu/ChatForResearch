import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  standalone: true,
  imports: [FormsModule, MarkdownModule],
})
export class Chat {
  messages: { id: number; content: string; role: string }[] = [];
  chatId: string | null = null;
  selectedModel = 'ChatGLM';
  newMessage = '';
  loading = false;
  userScrolled = false;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
  ) {}

  onScroll(event: Event) {
    const contentDiv = document.getElementById('content');
    if (contentDiv) {
      this.userScrolled = contentDiv.scrollTop + contentDiv.clientHeight < contentDiv.scrollHeight;
    }
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.chatId = params.get('id');
      this.loadChatMessages(this.chatId);
    });
  }

  loadChatMessages(chatId: string | null) {
    if (chatId) {
      // Load the chat messages for the given chatId
      this.messages = [];
    }
  }

  ngAfterViewChecked() {
    if (!this.userScrolled) {
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    const contentDiv = document.getElementById('content');
    if (contentDiv) {
      contentDiv.scrollTop = contentDiv.scrollHeight;
    }
  }

  checkEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // 允许换行
        return;
      } else {
        // 发送消息
        event.preventDefault(); // 防止默认的回车行为（如换行）
        this.sendMessage();
      }
    }
  }

  onSelectChange(event: any): void {
    this.selectedModel = event.target.value;
    console.log(this.selectedModel);
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push({
        id: this.messages.length + 1,
        content: this.newMessage,
        role: 'user',
      });
      this.streamMessages();
      this.userScrolled = false;
      this.newMessage = '';
    }
  }

  streamMessages() {
    this.loading = true;

    const botMessageId = this.messages.length + 1;

    this.messages.push({ id: botMessageId, content: '', role: 'assistant' });

    const requestData = {
      messages: this.messages.slice(0, this.messages.length - 1),
      model: this.selectedModel,
      temperature: 0.5,
      stream: true,
    };

    console.log(requestData);

    this.chatService.fetchPost(requestData).subscribe({
      next: (data) => {
        this.messages[this.messages.length - 1].content += data;
      },
      error: (error) => {
        console.error(error);
        this.loading = false;
      },
      complete: () => {
        console.log('Complete');
        this.loading = false;
      },
    });
  }
}
