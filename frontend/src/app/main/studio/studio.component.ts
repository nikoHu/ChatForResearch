import { Component } from '@angular/core';
import { Chat } from '../chat/chat.component';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { GlobalStateService } from '../../services/global-state.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';

interface KnowledgeBase {
  id: number;
  name: string;
  stats: string;
}

@Component({
  selector: 'studio',
  standalone: true,
  imports: [Chat, LucideAngularModule, PdfViewerModule],
  templateUrl: './studio.component.html',
})
export class Studio {
  knowledges: any = [];
  username = '';
  pdfSrc: string | Uint8Array | null = null;
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    public globalStateService: GlobalStateService,
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername() || '';

    const formData = new FormData();
    formData.append('username', this.username);

    this.http.post(environment.apiUrl + '/knowledge/all-knowledges', formData).subscribe({
      next: (data: any) => {
        console.log(data);
        this.knowledges = data['knowledges'];
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  selectedKnowledgeName: string | null = null;

  selectKnowledge(name: string): void {
    this.selectedKnowledgeName = this.selectedKnowledgeName === name ? null : name;
    this.globalStateService.studioKnowledgeName = this.selectedKnowledgeName || '';
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result instanceof ArrayBuffer) {
          this.pdfSrc = new Uint8Array(e.target.result);
        } else {
          this.pdfSrc = (e.target?.result as string) || null;
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('请选择一个PDF文件');
      this.pdfSrc = null;
    }
  }
}
