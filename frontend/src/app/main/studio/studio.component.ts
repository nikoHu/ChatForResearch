import { Component, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Chat } from '../chat/chat.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  @ViewChild('leftPanel') leftPanel!: ElementRef;
  @ViewChild('rightPanel') rightPanel!: ElementRef;

  leftWidth = 50;
  isDragging = false;
  minLeftWidth = 40; // 最小左侧宽度 (3:7)
  maxLeftWidth = 60; // 最大左侧宽度 (7:3)

  studio_mode = 'studio_default';
  knowledges: any = [];
  username = '';
  pdfSrc: string | Uint8Array | null = null;
  constructor(
    private el: ElementRef,
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

  ngAfterViewInit() {
    this.updatePanelSizes();
  }

  onMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isDragging = false;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const containerWidth = this.el.nativeElement.offsetWidth;
    let newLeftWidth = (event.clientX / containerWidth) * 100;

    // 应用最小和最大宽度限制
    newLeftWidth = Math.max(this.minLeftWidth, Math.min(newLeftWidth, this.maxLeftWidth));

    this.leftWidth = newLeftWidth;
    this.updatePanelSizes();
  }

  updatePanelSizes() {
    if (this.leftPanel && this.rightPanel) {
      this.leftPanel.nativeElement.style.width = `${this.leftWidth}%`;
      this.rightPanel.nativeElement.style.width = `${100 - this.leftWidth}%`;
    }
  }

  selectedKnowledgeName: string | null = null;

  selectKnowledge(name: string): void {
    this.selectedKnowledgeName = this.selectedKnowledgeName === name ? null : name;
    this.globalStateService.studioKnowledgeName = this.selectedKnowledgeName || '';
    this.studio_mode = 'studio_knowledge';
  }

  delete() {
    this.selectedKnowledgeName = null;
    this.studio_mode = 'studio_default';
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
