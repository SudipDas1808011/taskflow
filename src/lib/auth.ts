import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, SECRET) as { email: string };
    console.log("Decoded token:", decoded);
    return decoded;
  } catch (err) {
    console.log("Invalid token");
    return null;
  }
};