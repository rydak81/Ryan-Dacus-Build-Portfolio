'use client';

/**
 * There is no PDF in this repo, on purpose. A checked-in PDF drifts from
 * the page the moment either one is edited, and a résumé that disagrees
 * with the site it links to is worse than no résumé at all.
 *
 * Instead the print stylesheet in globals.css turns /about into a clean
 * black-on-white document, and this button is just window.print(). The
 * recruiter gets a PDF; it is generated from the same data as the page, so
 * it cannot be stale.
 */
export default function PrintResume({
  className = '',
  children = 'Print / save as PDF',
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {children}
    </button>
  );
}
