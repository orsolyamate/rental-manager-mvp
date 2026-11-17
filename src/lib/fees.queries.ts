import { queryOptions } from "@tanstack/react-query";
import { getFees } from "./fees.functions";

export const feesQueryOptions = () =>
  queryOptions({
    queryKey: ["fees"],
    queryFn: () => getFees(),
  });
