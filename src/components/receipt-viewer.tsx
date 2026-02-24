"use client";

export function ReceiptViewer({ url }: { url: string }) {
  const isPdf = url.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return (
      <iframe
        src={url}
        className="w-full h-[600px] border border-border"
        title="Receipt PDF"
      />
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt="Receipt"
      className="max-w-full border border-border"
    />
  );
}
