import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useQuery } from "./useQuery";

function navigate(url: string) {
  window.history.pushState(null, "", url);
}

afterEach(() => {
  navigate("/");
});

describe("useQuery", () => {
  it("returns the current URL's query params as an object", () => {
    navigate("/products?category=books&sort=price%20asc");

    const { result } = renderHook(() => useQuery());

    expect(result.current.params).toEqual({ category: "books", sort: "price asc" });
  });

  it("returns an empty object when there is no query string", () => {
    const { result } = renderHook(() => useQuery());

    expect(result.current.params).toEqual({});
  });

  it("updates when the browser navigates back or forward", () => {
    navigate("/?page=1");
    const { result } = renderHook(() => useQuery());

    act(() => {
      navigate("/?page=2");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current.params).toEqual({ page: "2" });
  });

  it("returns every value of a repeated key in order, and the last one in params", () => {
    navigate("/?tag=a&tag=b&tag=c");

    const { result } = renderHook(() => useQuery<"tag" | "page">());

    expect(result.current.getAll("tag")).toEqual(["a", "b", "c"]);
    expect(result.current.params.tag).toBe("c");
    expect(result.current.getAll("page")).toEqual([]);
  });

  it("types params and getAll by the declared keys", () => {
    navigate("/?page=2");

    const { result } = renderHook(() => useQuery<"page">());

    expectTypeOf(result.current.params).toEqualTypeOf<Readonly<{ page?: string }>>();
    expectTypeOf(result.current.getAll).returns.toEqualTypeOf<readonly string[]>();
    // @ts-expect-error -- "sort" is not a declared key
    expect(result.current.params.sort).toBeUndefined();
    // @ts-expect-error -- "sort" is not a declared key
    expect(result.current.getAll("sort")).toEqual([]);
  });

  it("keeps the same object between renders while the URL is unchanged", () => {
    navigate("/?q=honey");
    const { result, rerender } = renderHook(() => useQuery());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it("renders on the server as an empty object", () => {
    navigate("/?q=honey");
    function Probe() {
      return JSON.stringify(useQuery().params);
    }

    expect(renderToString(createElement(Probe))).toBe("{}");
  });
});
