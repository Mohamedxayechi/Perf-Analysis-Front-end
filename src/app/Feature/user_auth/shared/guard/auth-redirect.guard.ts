import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.checkAuth().pipe(
    tap((res) => {
      if (res) {
        // Navigate to dashboard if already authenticated
         router.navigateByUrl('/dashboard');
      }
    }),
    map((res) => !res), // block access if authenticated (redirected)
    catchError(() => of(true)) // allow if error (not authenticated)
  );
};
