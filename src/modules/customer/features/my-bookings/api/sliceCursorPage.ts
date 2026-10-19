// A page is read with one document more than its size: if that extra one
// arrives there is a next page, and if not, this is the last one, even when
// it is exactly full (a full last page must not offer an empty "next").
export const sliceCursorPage = <Item>(
  documents: readonly Item[],
  pageSize: number,
): { hasMorePages: boolean; pageDocuments: Item[] } => ({
  hasMorePages: documents.length > pageSize,
  pageDocuments: documents.slice(0, pageSize),
});
