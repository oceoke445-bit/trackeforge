import type { Metadata } from "next";
import LoginView from "./components/login-view";

export const metadata: Metadata = {
  title: "Sign in — Traxon",
};

export default function LoginPage() {
  return <LoginView />;
}
