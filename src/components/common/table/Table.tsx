import type { ReactElement } from "react";
import { cn } from "@/utils/cn";
import type {
  TableBodyProps,
  TableCaptionProps,
  TableCellProps,
  TableFooterProps,
  TableHeadProps,
  TableHeaderProps,
  TableProps,
  TableRowProps,
} from "./models/table.model";

export const Table = ({
  children,
  className,
  containerClassName,
  ...restProperties
}: TableProps): ReactElement => {
  return (
    <div
      className={cn(
        "relative w-full overflow-auto rounded-xl border border-border bg-card",
        containerClassName,
      )}
    >
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...restProperties}
      >
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({
  children,
  className,
  ...restProperties
}: TableHeaderProps): ReactElement => {
  return (
    <thead
      className={cn(
        "border-b border-border bg-muted/40 [&_tr]:border-b",
        className,
      )}
      {...restProperties}
    >
      {children}
    </thead>
  );
};

export const TableBody = ({
  children,
  className,
  ...restProperties
}: TableBodyProps): ReactElement => {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", className)}
      {...restProperties}
    >
      {children}
    </tbody>
  );
};

export const TableFooter = ({
  children,
  className,
  ...restProperties
}: TableFooterProps): ReactElement => {
  return (
    <tfoot
      className={cn(
        "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...restProperties}
    >
      {children}
    </tfoot>
  );
};

export const TableRow = ({
  children,
  className,
  ...restProperties
}: TableRowProps): ReactElement => {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted",
        className,
      )}
      {...restProperties}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({
  children,
  className,
  ...restProperties
}: TableHeadProps): ReactElement => {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...restProperties}
    >
      {children}
    </th>
  );
};

export const TableCell = ({
  children,
  className,
  ...restProperties
}: TableCellProps): ReactElement => {
  return (
    <td
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...restProperties}
    >
      {children}
    </td>
  );
};

export const TableCaption = ({
  children,
  className,
  ...restProperties
}: TableCaptionProps): ReactElement => {
  return (
    <caption
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...restProperties}
    >
      {children}
    </caption>
  );
};
