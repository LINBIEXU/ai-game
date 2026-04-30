"use client";

import { useRef, useState } from "react";

import type { ClassroomImageAsset } from "@/types/game";

interface ImageImportControlProps {
  label: string;
  emptyLabel?: string;
  hasImage?: boolean;
  disabled?: boolean;
  onImport: (file: File) => Promise<ClassroomImageAsset | void>;
}

export function ImageImportControl({ label, emptyLabel, hasImage = false, disabled = false, onImport }: ImageImportControlProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(emptyLabel ?? "等待导入图像");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setBusy(true);
    setMessage("正在写入本地课堂档案...");
    try {
      await onImport(file);
      setMessage("图像已归档");
    } catch (error) {
      console.warn("Failed to import image", error);
      setMessage(error instanceof Error ? error.message : "导入失败");
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "导入中" : hasImage ? `替换${label}` : `导入${label}`}
      </button>
      <div className="mt-2 text-xs leading-5 text-white/44">{hasImage ? message : message}</div>
    </div>
  );
}
