import { authErrorResponse, authResponse, signOut } from "@/server/devise";

export async function DELETE(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return authResponse({ message: "No session found.", fieldErrors: {} }, 401);
  }

  try {
    await signOut(authorization);
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
