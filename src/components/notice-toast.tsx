"use client";

type NoticeToastProps = {
  message: string;
};

export function NoticeToast({ message }: NoticeToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="print-hidden pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-[var(--panel-border)] bg-white px-5 py-2 text-sm font-medium text-[var(--main-text)] shadow-lg">
      {message}
    </div>
  );
}
