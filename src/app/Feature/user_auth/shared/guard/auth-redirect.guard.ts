import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.checkAuth().pipe(
    map((res) => {
      authService.authState$.next(res);
      router.navigateByUrl('/dashboard');
      return false;
    }),
    catchError(() => {
      return of(true);
    })
  );
};
