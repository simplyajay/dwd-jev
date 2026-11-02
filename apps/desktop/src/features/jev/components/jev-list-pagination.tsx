import type { PaginatedResult } from "@dwd-jev/shared";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  type LucideIcon,
} from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZES, type PageSize } from "../jev-list-search";

interface JevListPaginationProps {
  /** The shown page's numbers, all from one response, so they change together with the rows. */
  result: Omit<PaginatedResult<unknown>, "items">;
  /** The chosen rows per page; may be ahead of `result` while its page loads. */
  pageSize: PageSize;
  /** Locks every control, e.g. while a page loads. */
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

export function JevListPagination({
  result,
  pageSize,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: JevListPaginationProps) {
  const { page, totalPages, total } = result;
  const pageSizeLabelId = useId();
  const first = (page - 1) * result.pageSize + 1;
  const last = Math.min(page * result.pageSize, total);
  const isFirst = disabled || page <= 1;
  const isLast = disabled || page >= totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm">
      <div className="flex items-center gap-6 text-muted-foreground">
        <span className="tabular-nums">
          {total === 0 ? "No results" : `Showing ${first}–${last} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <span id={pageSizeLabelId}>Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value) as PageSize)}
            disabled={disabled}
          >
            <SelectTrigger size="sm" aria-labelledby={pageSizeLabelId} className="w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <PageButton
          label="First page"
          icon={ChevronsLeftIcon}
          disabled={isFirst}
          onClick={() => onPageChange(1)}
        />
        <PageButton
          label="Previous page"
          icon={ChevronLeftIcon}
          disabled={isFirst}
          onClick={() => onPageChange(page - 1)}
        />
        <span className="px-2 tabular-nums">
          Page {page} of {totalPages}
        </span>
        <PageButton
          label="Next page"
          icon={ChevronRightIcon}
          disabled={isLast}
          onClick={() => onPageChange(page + 1)}
        />
        <PageButton
          label="Last page"
          icon={ChevronsRightIcon}
          disabled={isLast}
          onClick={() => onPageChange(totalPages)}
        />
      </nav>
    </div>
  );
}

interface PageButtonProps {
  label: string;
  icon: LucideIcon;
  disabled: boolean;
  onClick: () => void;
}

function PageButton({ label, icon: Icon, disabled, onClick }: PageButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon />
    </Button>
  );
}
