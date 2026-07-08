import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/lib/AuthContext";
import { ToastProvider } from "@/lib/ToastContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </AuthProvider>
  );
}
