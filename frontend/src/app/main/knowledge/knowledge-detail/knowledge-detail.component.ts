import { Component } from '@angular/core';
import { RouterLink, RouterOutlet, ActivatedRoute, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { GlobalStateService } from '../../../services/global-state.service';

@Component({
  selector: 'knowledge-detail',
  standalone: true,
  imports: [RouterLink, RouterOutlet, RouterLinkActive, LucideAngularModule, FormsModule],
  templateUrl: './knowledge-detail.component.html',
})
export class KnowledgeDetail {
  name = '';

  constructor(
    private route: ActivatedRoute,
    public globalStateService: GlobalStateService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.name = params.get('name') || '';
      this.globalStateService.selectedKnowledgeName = this.name;
    });
  }

  onRouteActivated(isActive: boolean) {
    console.log('Route activated:', isActive);
  }
}
