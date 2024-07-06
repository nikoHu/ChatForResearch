import { Component } from '@angular/core';
import { Chat } from '../chat/chat.component';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { GlobalStateService } from '../../services/global-state.service';

interface KnowledgeBase {
  id: number;
  name: string;
  stats: string;
}

@Component({
  selector: 'studio',
  standalone: true,
  imports: [Chat, LucideAngularModule],
  templateUrl: './studio.component.html',
})
export class Studio {
  knowledges: any = [];
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
}
