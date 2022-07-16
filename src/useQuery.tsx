import { useEffect, useState } from "react";
import { ParamsType } from "./types";

export default function useQuery() {
    const [query, setQuery] = useState<ParamsType>({});

    useEffect(() => {
        if (window.location.search) {
            const search = window.location.search;
            const urlSearchParams = new URLSearchParams(search);
            const params: ParamsType = Object.fromEntries(urlSearchParams.entries());
            if (params) {
                setQuery(params);
            } else {
                setQuery({});
            }
        }
    }, []);

    return query;
}
