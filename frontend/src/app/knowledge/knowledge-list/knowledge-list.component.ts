import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'knowledge-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './knowledge-list.component.html',
})
export class KnowledgeList {}
