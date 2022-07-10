import { useQueryType } from "./types";

export function useQuery() {
    const search = window.location.search || "";
    const urlSearchParams = new URLSearchParams(search);
    const params: useQueryType = Object.fromEntries(urlSearchParams.entries());

    return Object.keys(params).length
        ? params
        : {
              page: 1,
              search: "",
          };
}
