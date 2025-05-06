/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const claimReq = route.data["claimReq"] as ((claims: Record<string, unknown>) => boolean) | undefined;

  return authService.checkAuth().pipe(
    map((claims: any) => {
      if (claimReq && !claimReq(claims)) {
        return router.parseUrl("/forbidden");
      }
      return true;
    }),
    catchError(() => {
      return of(router.parseUrl("/user/signin"));
    })
  );
};
