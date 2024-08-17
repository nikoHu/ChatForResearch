import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewChecked,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgClass } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { GlobalStateService } from '../../services/global-state.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface HistoryChat {
  username: string;
  mode: string;
}

interface HistoryChatResponse {
  history_chat: Array<{
    id: number;
    role: 'user' | 'assistant';
    content: string;
  }>;
}

@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule, MarkdownModule, NgClass],
})
export class Chat implements OnInit, AfterViewChecked {
  messages: { id: number; content: string; role: string; source: string; url: string }[] = [];
  chatId: string | null = null;
  selectedModel = 'glm4';
  models = [];
  newMessage = '';
  loading = false;
  userScrolled = false;
  historyLimit = 50;
  temperature = 5;
  username = '';
  source = '';
  apiEndpoint = 'chat/completions';
  @Input() mode: string = '';
  @Input() pdfname: string = '';

  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;
  isFullStyle = true;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private chatService: ChatService,
    private authService: AuthService,
    public globalStateService: GlobalStateService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.chatId = params.get('id');
    });
    this.username = this.authService.getUsername() || '';
    this.fetchModels();
    this.loadHistoryChat(this.username, this.mode);
  }

  ngAfterViewChecked() {
    if (!this.userScrolled) {
      this.scrollToBottom();
    }
  }

  adjustTextarea() {
    const textArea = this.textarea.nativeElement;
    this.isFullStyle = textArea.value === '';
    textArea.style.height = 'auto';
    textArea.style.height = textArea.scrollHeight + 'px';
  }

  onScroll(event: Event) {
    const contentDiv = document.getElementById('content');
    if (contentDiv) {
      this.userScrolled = contentDiv.scrollTop + contentDiv.clientHeight < contentDiv.scrollHeight;
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
        this.isFullStyle = false;
      } else {
        event.preventDefault();
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
        source: '',
        url: '',
      });
      this.source = '';
      this.streamMessages();
      this.userScrolled = false;
      this.newMessage = '';
      textArea.style.height = 'auto';
      this.isFullStyle = true;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.resetState();
    }
  }

  private resetState() {
    this.messages = [];
    this.loadHistoryChat(this.username, this.mode);
  }

  streamMessages() {
    this.loading = true;

    const botMessageId = this.messages.length + 1;
    this.messages.push({ id: botMessageId, content: '', role: 'assistant', source: '', url: '' });

    const messages_length = this.messages.length;
    const requestData: any = {
      mode: this.mode,
      username: this.username,
      message: this.newMessage,
      model: this.selectedModel,
      temperature: this.temperature,
      history_length: this.historyLimit,
    };

    if (this.globalStateService.studioKnowledgeName) {
      requestData.knowledge_name = this.globalStateService.studioKnowledgeName;
      this.apiEndpoint = 'chat/knowledge-completions';
    }

    if (this.mode === 'studio_pdf') {
      requestData.filename = this.pdfname;
      console.log('PDF name:', this.pdfname);
      this.apiEndpoint = 'chat/pdf-completions';
    }

    this.chatService.fetchPost(requestData, this.apiEndpoint).subscribe({
      next: (data: any) => {
        if (data.type === 'answer') {
          // 处理答案
          this.messages[this.messages.length - 1].content += data.content;
          console.log('Answer:', data.content);
        } else if (data.type === 'source') {
          // 处理源文档
          this.messages[this.messages.length - 1].source = data.content;
          this.messages[this.messages.length - 1].url =
            `${this.username}/${this.globalStateService.studioKnowledgeName}/${data.content}`;
          console.log('Source:', data.content);
        }
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

  loadHistoryChat(username: string, mode: string): void {
    const url = 'http://localhost:8000/chat/load-history-chat';
    const payload: HistoryChat = { username, mode };
    console.log('Payload:', payload);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    this.http.post<HistoryChatResponse>(url, payload, { headers }).subscribe({
      next: (response) => {
        this.messages = response.history_chat.map((chat) => ({
          id: chat.id,
          content: chat.content,
          role: chat.role,
          source: '',
          url: '',
        }));
      },
      error: (error) => {
        console.error('Error fetching chat history:', error);
      },
    });
  }

  resetChat(username: string, mode: string): void {
    const url = 'http://localhost:8000/chat/reset-chat';
    const filename = this.pdfname;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    this.http.post<any>(url, { username, mode, filename }, { headers }).subscribe({
      next: (response) => {
        console.log('Chat reset:', response);
      },
      error: (error) => {
        console.error('Error fetching chat history:', error);
      },
    });
  }

  fetchModels() {
    this.http.get<any>('http://localhost:8000/chat/models').subscribe({
      next: (response) => {
        this.models = response.models;
      },
      error: (error) => {
        console.error('Error fetching models:', error);
      },
    });
  }

  openFile(source: string) {
    if (source) {
      const [knowledgeName, filename] = source.split('/');
      const url = `http://localhost:8000/knowledge/${source}`;
      window.open(url, '_blank');
    }
  }
}
