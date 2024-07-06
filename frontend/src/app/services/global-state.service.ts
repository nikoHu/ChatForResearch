import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalStateService {
  knowledgeName: string = '';
  selectedKnowledgeName: string = '';
  studioKnowledgeName: string = '';
  fileName: string = '';
  isBuilding: boolean = true;
  steps: boolean[] = [false, false];
}
