import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { delay } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'upload',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './upload.component.html',
  styles: [
    `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      @keyframes slideOutRight {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(100%);
        }
      }

      .translate-x-0 {
        animation: slideInRight 0.3s ease-out;
      }

      .translate-x-full {
        animation: slideOutRight 0.3s ease-in;
      }
    `,
  ],
})
export class Upload {
  constructor(private http: HttpClient) {}

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('dropZone') dropZone!: ElementRef<HTMLDivElement>;

  selectedOption = 'local';
  options = [
    { id: 'local', label: '导入已有文本' },
    { id: 'web', label: '同步自 Web 站点' },
  ];
  uploadedFile: File | null = null;
  showToast = false;
  toastMessage = '';
  toastFading = false;
  isUploading = false;
  url = '';

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropZone.nativeElement.classList.add('bg-blue-50');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropZone.nativeElement.classList.remove('bg-blue-50');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropZone.nativeElement.classList.remove('bg-blue-50');
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  handleFile(file: File) {
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    const allowedExtensions = ['.pdf', '.txt', '.md', '.markdown'];

    const fileExtension = file.name.toLowerCase().slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2);

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(`.${fileExtension}`)) {
      this.showToastMessage('文件类型不支持');
      return;
    }

    if (file.size <= 10 * 1024 * 1024) {
      // 10MB limit
      this.isUploading = true;

      const formData = new FormData();
      formData.append('file', file);

      this.http
        .post(`${environment.apiUrl}/knowledge/upload`, formData)
        .pipe(delay(2000))
        .subscribe({
          next: () => {
            console.log('Upload complete');
            this.uploadedFile = file;
            this.isUploading = false;
          },
          error: (error) => {
            console.error('Upload failed', error);
            this.isUploading = false;
            this.showToastMessage('上传失败：' + (error.error?.message || '未知错误'));
          },
        });
    } else {
      this.showToastMessage('文件大小不能超过 10MB');
    }
  }

  removeFile() {
    this.uploadedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  nextButtonClass(): string {
    const baseClass = 'mt-6 w-full py-2 rounded-lg font-medium transition-all duration-300';
    if (!this.uploadedFile && this.selectedOption === 'local') {
      return `${baseClass} bg-blue-400 text-white cursor-not-allowed opacity-50`;
    }
    return `${baseClass} bg-blue-600 text-white hover:bg-blue-700`;
  }

  showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    this.toastFading = false;

    setTimeout(() => {
      this.toastFading = true;
      setTimeout(() => {
        this.showToast = false;
      }, 300);
    }, 3000);
  }
}
