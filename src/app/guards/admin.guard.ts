import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

/**
 * Protects every /admin/* route except /admin/login.
 *
 * Waits for the auth service to finish hydrating its session from
 * localStorage so a hard-refresh on an admin page doesn't bounce a logged-in
 * admin to the login screen.
 */
export const adminGuard: CanActivateFn = async (route, state): Promise<boolean | UrlTree> => {
  const auth   = inject(AdminAuthService);
  const router = inject(Router);

  // Wait for ready signal — handles hard-refresh on admin pages
  if (!auth.ready()) {
    await new Promise<void>(resolve => {
      const check = () => auth.ready() ? resolve() : setTimeout(check, 30);
      check();
    });
  }

  if (auth.isAuthenticated()) return true;
  return router.parseUrl(`/adminauthlogin?from=${encodeURIComponent(state.url)}`);
};
