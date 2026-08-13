export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    // Protect everything except auth pages, API auth routes, and static files
    "/((?!api/auth|login|signup|reset-password|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
