import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface TableProps extends ComponentPropsWithoutRef<"table"> {
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
}

export interface TableHeaderProps extends ComponentPropsWithoutRef<"thead"> {
  children?: ReactNode;
  className?: string;
}

export interface TableBodyProps extends ComponentPropsWithoutRef<"tbody"> {
  children?: ReactNode;
  className?: string;
}

export interface TableFooterProps extends ComponentPropsWithoutRef<"tfoot"> {
  children?: ReactNode;
  className?: string;
}

export interface TableRowProps extends ComponentPropsWithoutRef<"tr"> {
  children?: ReactNode;
  className?: string;
}

export interface TableHeadProps extends ComponentPropsWithoutRef<"th"> {
  children?: ReactNode;
  className?: string;
}

export interface TableCellProps extends ComponentPropsWithoutRef<"td"> {
  children?: ReactNode;
  className?: string;
}

export interface TableCaptionProps extends ComponentPropsWithoutRef<"caption"> {
  children?: ReactNode;
  className?: string;
}
