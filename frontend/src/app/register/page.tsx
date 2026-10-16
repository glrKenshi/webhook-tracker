import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function RegisterPage() {
  return <AuthScreen mode="sign-up" />;
}
