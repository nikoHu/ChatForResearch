import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalStateService {
  knowledgeName: string = '';
  fileName: string = '';
  isBuilding: boolean = true;
  steps: boolean[] = [false, false];
}
