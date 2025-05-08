import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { claimReq } from '../../../shared/utils/claim-req-utils';
import { AuthService } from '../../../shared/services/auth.service';
import { HideIfClaimsNotMetDirective } from '../../../directive/hide-if-claims-not-met.directive';


@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink,HideIfClaimsNotMetDirective],
  templateUrl: './main-layout.component.html',
  styles: ``
})
export class MainLayoutComponent {
  constructor(private router: Router,
    private authService: AuthService) { }

  claimReq = claimReq

  onLogout() {
    this.authService.logout().subscribe({
      next:()=>{
        this.router.navigateByUrl('/user/signin');
      },
      error:(err)=>{
        console.error("Cant Logout",err)
      }
    })
    
  }
}
