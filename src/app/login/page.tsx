import type { Metadata } from "next";
import LoginView from "./components/login-view";

export const metadata: Metadata = {
  title: "Sign in — TrackForge",
};

export default function LoginPage() {
  return <LoginView />;
}
