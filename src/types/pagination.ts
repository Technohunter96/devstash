// Generic page of results plus the full resource count, for computing total pages
export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
}