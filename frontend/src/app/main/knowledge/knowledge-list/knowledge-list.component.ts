import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
import { GlobalStateService } from '../../../services/global-state.service';

@Component({
  selector: 'knowledge-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './knowledge-list.component.html',
})
export class KnowledgeList {
  konwledges: any = [];
  username = '';

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
        this.konwledges = data['knowledges'];
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  delete(event: Event, knowledgeName: string) {
    event.preventDefault();
    event.stopPropagation();

    const formData = new FormData();
    formData.append('username', this.username);
    formData.append('knowledgeName', knowledgeName);

    this.http.post(environment.apiUrl + '/knowledge/delete-knowledge', formData).subscribe({
      next: (data: any) => {
        console.log(data);
        this.konwledges = this.konwledges.filter((knowledge: string) => knowledge !== knowledgeName);
      },
      error: (error) => {
        console.error(error);
      },
    });
  }
}
