import { Suspense } from "react";
import { EndpointsScreen } from "@/components/endpoints-screen";
import { ScreenStatus } from "@/components/auth-shell";

export const metadata = {
  title: "Endpoints",
};

export default function EndpointsPage() {
  return (
    <Suspense fallback={<ScreenStatus>Loading…</ScreenStatus>}>
      <EndpointsScreen />
    </Suspense>
  );
}
