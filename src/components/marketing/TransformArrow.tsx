import { ArrowRight } from "lucide-react";

// Pulses via CSS only — the mobile 90° rotation is read from --arrow-rotate inside the
// arrow-pulse keyframes themselves, so a plain `transform` override wouldn't get clobbered every frame
export function TransformArrow() {
  return (
    <div
      className="flex size-11 shrink-0 animate-[arrow-pulse_1.8s_ease-in-out_infinite] items-center justify-center self-center text-blue-500 max-sm:[--arrow-rotate:90deg]"
    >
      <ArrowRight className="size-full" strokeWidth={2.5} />
    </div>
  );
}
