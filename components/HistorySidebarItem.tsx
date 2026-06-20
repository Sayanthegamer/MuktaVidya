import { memo, useCallback } from "react";
import Image from "next/image";
import { FileText } from "@phosphor-icons/react";
import { HistoryItem } from "../types/history";

interface HistorySidebarItemProps {
  item: HistoryItem;
  onSelect: (item: HistoryItem) => void;
  onClose: () => void;
}

const HistorySidebarItem = memo(function HistorySidebarItem({
  item,
  onSelect,
  onClose
}: HistorySidebarItemProps) {
  const handleClick = useCallback(() => {
    onSelect(item);
    onClose();
  }, [item, onSelect, onClose]);

  const formattedDate = new Date(item.timestamp).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const displayLanguage = item.language === 'BN' ? 'BN' : item.language === 'HI' ? 'HI' : 'EN';
  const previewText = item.preview || item.solution.replace(/[#*`_]/g, '').substring(0, 100) + '...';

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex gap-3 p-3 hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border-subtle)] last:border-0 text-left items-start"
    >
      {/* Thumbnail */}
      <div className="relative shrink-0 w-12 h-12 rounded-md overflow-hidden bg-[var(--surface-3)] flex items-center justify-center border border-[var(--border-subtle)]">
        {item.imageBase64 ? (
          <Image src={item.imageBase64} alt="" fill sizes="48px" className="w-full h-full object-cover" unoptimized />
        ) : (
          <FileText size={24} className="text-[var(--text-muted)]" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5 bg-[var(--surface-1)]">
            {displayLanguage}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] truncate whitespace-nowrap">
            {formattedDate}
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
          {previewText}
        </p>
      </div>
    </button>
  );
});

export default HistorySidebarItem;
