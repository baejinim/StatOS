import { notFound } from "next/navigation";

import { Microphone } from "@/components/icons/Microphone";
import { isFeatureEnabled } from "@/lib/features";

export default function DesignDetailsPage() {
  if (!isFeatureEnabled("designDetails")) {
    notFound();
  }
  return (
    <div className="flex flex-1 items-center justify-center">
      <Microphone size={100} className="opacity-10" />
    </div>
  );
}
