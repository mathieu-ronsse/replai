import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)','/', '/api/webhooks/clerk', '/api/webhooks/stripe']);

export default clerkMiddleware((auth, request) => {
  //publicRoutes: ['/', '/api/webhooks/clerk', '/api/webhooks/stripe']
  if(!isPublicRoute(request)) {
    auth().protect();
  }
});


export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};