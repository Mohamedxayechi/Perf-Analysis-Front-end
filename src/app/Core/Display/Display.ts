import { Injectable } from '@angular/core';

import { Engine } from '../Engine';
import {EventPayload } from '../Utility/event-bus';



@Injectable({
  providedIn: 'root',
})
export class Display {
  
  constructor() {
    // No dependencies
  }

  handleEvent(event: EventPayload): void {
   
  }

  
}