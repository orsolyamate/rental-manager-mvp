import { queryOptions } from "@tanstack/react-query";
import { getFixedData } from "./fixed-data.functions";

export const fixedDataQueryOptions = () =>
  queryOptions({
    queryKey: ["fixed-data"],
    queryFn: () => getFixedData(),
    staleTime: 5 * 60 * 1000,
  });
