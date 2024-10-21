import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Make sure that the `/api/webhooks(.*)` route is not protected here
// export default clerkMiddleware()

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// }

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)','/', '/api/webhooks/clerk', '/api/webhooks/stripe','/api/webhooks/stripe(.*)']);

export default clerkMiddleware((auth, request) => {
  //publicRoutes: ['/', '/api/webhooks/clerk', '/api/webhooks/stripe']
  if(!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};