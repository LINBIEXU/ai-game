import { chapterTwoCinematicSlots, type ChapterTwoCinematicSlotId } from "@/lib/chapter-two-narrative";

export function ChapterTwoCinematicSlot({
  slotId,
  className = ""
}: {
  slotId: ChapterTwoCinematicSlotId;
  className?: string;
}) {
  const slot = chapterTwoCinematicSlots[slotId];
  const mediaNode = slot.mediaUrl ? (
    slot.mediaKind === "video" ? (
      <video src={slot.mediaUrl} poster={slot.posterUrl ?? undefined} autoPlay muted loop playsInline />
    ) : (
      <div className="chapter-two-cinematic-slot__image" style={{ backgroundImage: `url(${slot.mediaUrl})` }} aria-hidden="true" />
    )
  ) : (
    <div className="chapter-two-cinematic-slot__fallback" aria-hidden="true">
      <span>{slot.label}</span>
      <strong>残影未定</strong>
    </div>
  );

  return (
    <div
      className={`chapter-two-cinematic-slot ${className}`}
      aria-label={slot.label}
      data-slot-id={slot.id}
      data-empty={slot.mediaUrl ? "false" : "true"}
    >
      {mediaNode}
      <i aria-hidden="true" />
    </div>
  );
}
