import { format, parse, startOfMonth } from 'date-fns';

export const formatReferenceMonth = (monthString: string): string => {
  // Convert YYYY-MM to YYYY-MM-DD format for Postgres
  const date = startOfMonth(parse(monthString, 'yyyy-MM', new Date()));
  return format(date, 'yyyy-MM-dd');
};