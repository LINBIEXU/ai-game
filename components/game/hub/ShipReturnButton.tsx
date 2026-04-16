"use client";

interface ShipReturnButtonProps {
  onClick: () => void;
}

export function ShipReturnButton({ onClick }: ShipReturnButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-xs tracking-[0.18em] text-white/64 transition hover:border-white/24 hover:bg-white/[0.06]"
    >
      返回主舰
    </button>
  );
}
