import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalStateService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  isOpen$ = this.isOpenSubject.asObservable();

  constructor() {}

  setIsOpen() {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  getIsOpen() {
    return this.isOpenSubject.value;
  }
}
