import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useQuery } from "./useQuery";
import { useQueryState } from "./useQueryState";

function navigate(url: string) {
  window.history.pushState(null, "", url);
}

afterEach(() => {
  navigate("/");
});

describe("useQueryState", () => {
  it("returns the current query like useQuery does", () => {
    navigate("/products?category=books&tag=a&tag=b");

    const { result } = renderHook(() => useQueryState<"category" | "tag">());
    const [query] = result.current;

    expect(query.params).toEqual({ category: "books", tag: "b" });
    expect(query.getAll("tag")).toEqual(["a", "b"]);
  });

  it("merges updates into the URL, keeping the path, hash and other params, and re-renders", () => {
    navigate("/products?category=books&sort=price#reviews");
    const { result } = renderHook(() => useQueryState<"category" | "sort" | "page">());

    act(() => {
      result.current[1]({ page: "2", sort: "rating" });
    });

    expect(window.location.pathname).toBe("/products");
    expect(window.location.hash).toBe("#reviews");
    expect(window.location.search).toBe("?category=books&sort=rating&page=2");
    expect(result.current[0].params).toEqual({ category: "books", sort: "rating", page: "2" });
  });

  it("updates every useQuery reader on the page", () => {
    navigate("/?page=1");
    const reader = renderHook(() => useQuery<"page">());
    const writer = renderHook(() => useQueryState<"page">());

    act(() => {
      writer.result.current[1]({ page: "2" });
    });

    expect(reader.result.current.params.page).toBe("2");
  });

  it("removes a key set to null and writes an array as repeated keys", () => {
    navigate("/?q=honey&tag=old&page=3");
    const { result } = renderHook(() => useQueryState<"q" | "tag" | "page">());

    act(() => {
      result.current[1]({ page: null, tag: ["new", "sale"] });
    });
    expect(window.location.search).toBe("?q=honey&tag=new&tag=sale");

    act(() => {
      result.current[1]({ tag: [] });
    });
    expect(window.location.search).toBe("?q=honey");
  });

  it("replaces the history entry by default, and adds one with mode push", () => {
    navigate("/?page=1");
    const { result } = renderHook(() => useQueryState<"page">());
    const before = window.history.length;

    act(() => {
      result.current[1]({ page: "2" });
    });
    expect(window.history.length).toBe(before);

    act(() => {
      result.current[1]({ page: "3" }, { mode: "push" });
    });
    expect(window.history.length).toBe(before + 1);
    expect(window.location.search).toBe("?page=3");
  });

  it("writes nothing when the update leaves the URL as it is", () => {
    navigate("/?page=1&tag=a");
    const { result } = renderHook(() => useQueryState<"page" | "tag" | "q">());
    const before = window.history.length;
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");

    act(() => {
      result.current[1]({ page: "1", tag: ["a"], q: null }, { mode: "push" });
      result.current[1]({});
    });

    expect(window.history.length).toBe(before);
    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("treats differently encoded but equal values as unchanged", () => {
    navigate("/?q=red%20honey");
    const { result } = renderHook(() => useQueryState<"q">());
    const replaceState = vi.spyOn(window.history, "replaceState");

    act(() => {
      result.current[1]({ q: "red honey" });
    });

    expect(replaceState).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?q=red%20honey");
  });

  it("keeps the router's history.state when it writes", () => {
    window.history.pushState({ routerKey: "abc" }, "", "/?page=1");
    const { result } = renderHook(() => useQueryState<"page">());

    act(() => {
      result.current[1]({ page: "2" });
    });

    expect(window.history.state).toEqual({ routerKey: "abc" });
  });

  it("keeps setQuery's identity across URL changes", () => {
    const { result } = renderHook(() => useQueryState<"page">());
    const [, setQuery] = result.current;

    act(() => {
      setQuery({ page: "2" });
    });

    expect(result.current[1]).toBe(setQuery);
  });

  it("only accepts the declared keys", () => {
    const { result } = renderHook(() => useQueryState<"page">());
    const [, setQuery] = result.current;

    act(() => {
      // @ts-expect-error -- "sort" is not a declared key
      setQuery({ sort: "price" });
      // @ts-expect-error -- values are strings, string arrays or null
      setQuery({ page: 2 });
    });

    expect(window.location.search).toBe("?sort=price&page=2");
  });

  it("renders on the server as an empty query", () => {
    function Probe() {
      return JSON.stringify(useQueryState()[0].params);
    }

    expect(renderToString(createElement(Probe))).toBe("{}");
  });
});
