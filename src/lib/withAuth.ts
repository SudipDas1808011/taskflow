import { NextResponse } from "next/server";
import { getUserFromReq } from "./getUser";

export type AuthHandler = (req: Request, user: { email: string }) => Promise<NextResponse>;

export function withAuth(handler: AuthHandler) {
  return async (req: Request) => {
    try {
      const user = getUserFromReq(req);

      if (!user) {
        return NextResponse.json(
          { message: "Unauthorized: Missing or invalid token" },
          { status: 401 }
        );
      }

      return await handler(req, user);
    } catch (error) {
      console.error("Auth error:", error);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
