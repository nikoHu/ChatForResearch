import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { delay } from 'rxjs/operators';
import { GlobalStateService } from '../../../services/global-state.service';
import { environment } from '../../../../environments/environment';

interface Segment {
  content: string;
  charCount: number;
}

@Component({
  selector: 'split',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './split.component.html',
})
export class Split {
  separator = '，';
  maxLength = 100;
  overlapLength = 10;
  replaceSpaces = true;
  segments: Segment[] = [];

  constructor(
    private http: HttpClient,
    public globalStateService: GlobalStateService,
  ) {}

  reset() {
    this.maxLength = 100;
    this.overlapLength = 10;
    this.replaceSpaces = true;
    this.separator = '，';
    this.segments = [];
  }

  createFormData() {
    const formData = new FormData();
    formData.append('knowledgeName', this.globalStateService.knowledgeName);
    formData.append('fileName', this.globalStateService.fileName);
    formData.append('maxLength', this.maxLength.toString());
    formData.append('overlapLength', this.overlapLength.toString());
    formData.append('replaceSpaces', this.replaceSpaces.toString());
    formData.append('separator', this.separator);
    return formData;
  }

  preview() {
    const formData = this.createFormData();

    this.http
      .post(`${environment.apiUrl}/knowledge/preview-segments`, formData)
      .pipe()
      .subscribe({
        next: (response: any) => {
          if (response && response.contents) {
            this.segments = response.contents.map((content: string) => ({
              content: content,
              charCount: content.length,
            }));
          } else {
            console.error('Unexpected response format:', response);
          }
        },
        error: (error) => {
          console.error('Error previewing segments:', error);
        },
      });
  }

  saveAndProcess() {
    this.globalStateService.steps[1] = true;

    const formData = this.createFormData();

    this.http
      .post(`${environment.apiUrl}/knowledge/create-vector-db`, formData)
      .pipe(delay(1000))
      .subscribe({
        next: (response: any) => {
          if (response) {
            console.log('Segments processed and saved successfully');
            this.globalStateService.isBuilding = false;
          } else {
            console.error('Unexpected response format:', response);
          }
        },
        error: (error) => {
          console.error('Error previewing segments:', error);
        },
      });
  }
}
