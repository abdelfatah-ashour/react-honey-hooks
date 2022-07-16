import { ParamsType } from "./types";

export default function useQuery() {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params: ParamsType = Object.fromEntries(urlSearchParams.entries());

  return Object.keys(params).length
    ? params
    : {
        page: 1,
        search: ""
      };
}
