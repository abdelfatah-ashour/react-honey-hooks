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

    expect(result.current).toEqual({ category: "books", sort: "price asc" });
  });

  it("returns an empty object when there is no query string", () => {
    const { result } = renderHook(() => useQuery());

    expect(result.current).toEqual({});
  });

  it("updates when the browser navigates back or forward", () => {
    navigate("/?page=1");
    const { result } = renderHook(() => useQuery());

    act(() => {
      navigate("/?page=2");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current).toEqual({ page: "2" });
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
      return JSON.stringify(useQuery());
    }

    expect(renderToString(createElement(Probe))).toBe("{}");
  });
});
