// Point d'entrée technique de Better Auth (liens de vérification d'e-mail, de réinitialisation…).
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
