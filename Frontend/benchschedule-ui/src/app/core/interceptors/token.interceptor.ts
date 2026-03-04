import { HttpInterceptorFn } from '@angular/common/http';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof window === 'undefined') return next(req);

  const token = localStorage.getItem('token');
  if (!token || req.url.includes('/api/v1.0/login') || req.url.includes('/api/v1.0/register')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'x-access-token': token,
      },
    })
  );
};