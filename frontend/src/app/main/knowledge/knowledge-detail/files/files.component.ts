import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../services/auth.service';
import { GlobalStateService } from '../../../../services/global-state.service';

interface FileData {
  id: number;
  name: string;
  characterCount: number;
}

@Component({
  selector: 'files',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './files.component.html',
})
export class Files {
  searchTerm: string = '';
  files: FileData[] = [];
  filteredFiles: FileData[] = this.files;
  username = '';
  knowledgeName = '';

  search() {
    if (!this.searchTerm) {
      this.filteredFiles = this.files;
    } else {
      this.filteredFiles = this.files.filter((file) => file.name.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }
  }

  deleteFile(fileName: string) {
    const formData = new FormData();
    formData.append('username', this.username);
    formData.append('knowledgeName', this.knowledgeName);
    formData.append('fileName', fileName);

    this.http.post(environment.apiUrl + '/knowledge/delete-file', formData).subscribe({
      next: (data: any) => {
        console.log(data);
        this.files = this.files.filter((file) => file.name !== fileName);
        this.filteredFiles = this.files;
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    public globalStateService: GlobalStateService,
  ) {
    this.knowledgeName = this.globalStateService.selectedKnowledgeName;
  }

  ngOnInit() {
    this.username = this.authService.getUsername() || '';
    const formData = new FormData();
    formData.append('username', this.username);
    formData.append('knowledgeName', this.knowledgeName);
    this.http.post(environment.apiUrl + '/knowledge/all-files', formData).subscribe({
      next: (data: any) => {
        console.log(data);
        this.files = data.files.map((file: any, index: number) => {
          return {
            id: index + 1,
            name: file.name,
            characterCount: file.size,
          };
        });
        this.filteredFiles = this.files;
      },
      error: (error) => {
        console.error(error);
      },
    });
  }
}
