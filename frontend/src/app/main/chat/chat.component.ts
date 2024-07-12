import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { GlobalStateService } from '../../services/global-state.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  standalone: true,
  imports: [FormsModule, MarkdownModule, NgClass],
})
export class Chat {
  messages: { id: number; content: string; role: string }[] = [];
  chatId: string | null = null;
  selectedModel = 'ChatGLM';
  newMessage = '';
  loading = false;
  userScrolled = false;
  historyLimit = 50;
  temperature = 5;
  username = '';
  has_context = false;
  source = '';

  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;
  isFullStyle = true;

  adjustTextarea() {
    const textArea = this.textarea.nativeElement;
    if (textArea.value === '') {
      this.isFullStyle = true;
    } else {
      this.isFullStyle = false;
    }
    textArea.style.height = 'auto';
    textArea.style.height = textArea.scrollHeight + 'px';
  }

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private authService: AuthService,
    public globalStateService: GlobalStateService,
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
    // this.adjustTextareaHeight();
    this.username = this.authService.getUsername() || '';
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
        this.isFullStyle = false;
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
  }

  sendMessage() {
    const textArea = this.textarea.nativeElement;
    if (this.newMessage) {
      this.messages.push({
        id: this.messages.length + 1,
        content: this.newMessage.trim(),
        role: 'user',
      });
      this.streamMessages();
      this.userScrolled = false;
      this.newMessage = '';
      textArea.style.height = 'auto';
      this.isFullStyle = true;
    }
  }

  streamMessages() {
    this.loading = true;

    const botMessageId = this.messages.length + 1;

    this.messages.push({ id: botMessageId, content: '', role: 'assistant' });

    const messages_length = this.messages.length;
    const requestData = {
      messages: this.messages.slice(messages_length - this.historyLimit - 1, this.messages.length - 1),
      model: this.selectedModel,
      temperature: this.temperature,
      stream: true,
      is_enable_knowledge: !!this.globalStateService.studioKnowledgeName,
      knowledge_name: this.globalStateService.studioKnowledgeName,
      username: this.username,
    };

    this.chatService.fetchPost(requestData).subscribe({
      next: (data) => {
        this.messages[this.messages.length - 1].content += data.content;
        this.has_context = data.has_context;
        this.source = data.source;
        console.log('Content:', data.content);
        console.log('Has context:', data.has_context);
        console.log('Source:', data.source);
      },
      error: (error) => {
        console.error(error);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
