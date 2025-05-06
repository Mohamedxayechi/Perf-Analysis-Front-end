import { Component } from '@angular/core';
import { claimReq } from '../../shared/utils/claim-req-utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styles: ``
})
export class DashboardComponent  {
  claimReq=claimReq
}
