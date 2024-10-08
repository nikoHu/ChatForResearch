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
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

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
  selectedModel = 'llama3.1';
  models = [];
  newMessage = '';
  loading = false;
  isModelLoading = false;
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

  async onSelectChange(event: any): Promise<void> {
    const newModel = event.target.value;
    console.log('New model:', newModel);
    this.isModelLoading = true;
    try {
      // Unload old model
      if (this.selectedModel) {
        await firstValueFrom(
          this.http.post(`${environment.apiUrl}/models/unload`, { current_model: this.selectedModel }),
        );
      }
      // Load new model
      await firstValueFrom(this.http.post(`${environment.apiUrl}/models/load`, { current_model: newModel }));
      this.selectedModel = newModel;
    } catch (error) {
      console.error('Error switching model:', error);
      // Handle error, might need to rollback to previous model or display error message
    } finally {
      this.isModelLoading = false;
    }
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
      selected_prompt: this.globalStateService.selectedPrompt,
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
    const url = `${environment.apiUrl}/chat/load-history-chat`;
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

  resetChat(): void {
    const url = `${environment.apiUrl}/chat/reset-chat`;
    const payload = {
      username: this.username,
      mode: this.mode,
      filename: this.mode === 'studio_pdf' ? this.pdfname : undefined,
    };

    this.http.post<any>(url, payload).subscribe({
      next: (response) => {
        console.log('Chat reset:', response);
        this.messages = []; // 清空消息列表
        // 可能需要重新初始化其他状态
      },
      error: (error) => {
        console.error('Error resetting chat:', error);
        // 可以添加错误处理,比如显示一个错误提示
      },
    });
  }

  fetchModels() {
    this.http.get<any>(`${environment.apiUrl}/chat/models`).subscribe({
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
      const url = `${environment.apiUrl}/knowledge/${source}`;
      window.open(url, '_blank');
    }
  }
}
