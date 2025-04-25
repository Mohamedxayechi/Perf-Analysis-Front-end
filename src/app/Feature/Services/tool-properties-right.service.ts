import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToolPropertiesRightService {


  private showPropertiesSubject = new BehaviorSubject<boolean>(false);
  showProperties$ = this.showPropertiesSubject.asObservable();

  togglePropertiesPanel() {
    this.showPropertiesSubject.next(!this.showPropertiesSubject.value);
  }

  setPropertiesPanelVisibility(visible: boolean) {
    this.showPropertiesSubject.next(visible);
  }
  
}

