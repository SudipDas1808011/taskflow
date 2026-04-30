import { verifyToken } from "./auth";

export const getUserFromReq = (req: Request) => {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];

  if (!token) return null;

  return verifyToken(token);
};