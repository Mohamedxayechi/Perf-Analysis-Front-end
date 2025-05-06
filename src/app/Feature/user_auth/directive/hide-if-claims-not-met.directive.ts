/* eslint-disable @typescript-eslint/no-explicit-any */
import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';

@Directive({
  selector: '[appHideIfClaimsNotMet]',
  standalone: true
})
export class HideIfClaimsNotMetDirective implements OnInit {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  @Input("appHideIfClaimsNotMet") claimReq!: Function;
  claims:any
  constructor(private authService: AuthService,
    private elementRef: ElementRef) { }

  ngOnInit(): void {
    this.authService.checkAuth().subscribe({
      next:(res:any)=>{
        if (!this.claimReq(res))
          this.elementRef.nativeElement.style.display = "none";
      },
      error: () => {
        this.elementRef.nativeElement.style.display = "none";
      },
    })
  }
}
