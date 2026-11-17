import { queryOptions } from "@tanstack/react-query";
import { getInvoices } from "./invoices.functions";

export const invoicesQueryOptions = () =>
  queryOptions({
    queryKey: ["invoices"],
    queryFn: () => getInvoices(),
  });
