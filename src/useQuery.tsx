import { useEffect, useState } from "react";
import { ParamsType, QueryType } from "./types";

export default function useQuery() {
  let search: string = window.location.search;
  const [query, setQuery] = useState<QueryType | object>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlSearchParams = new URLSearchParams(search);
      const params: ParamsType = Object.fromEntries(urlSearchParams.entries());

      setQuery(params);
    } else {
      setQuery({});
    }
    return () => {
      setQuery({});
    };
  }, [search]);

  return query;
}
