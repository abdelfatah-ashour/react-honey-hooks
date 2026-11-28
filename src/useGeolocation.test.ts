import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useGeolocation } from "./useGeolocation";

interface Request {
  success: PositionCallback;
  error: PositionErrorCallback | null | undefined;
  options: PositionOptions | undefined;
  watchId?: number;
}

/** jsdom has no Geolocation API. This records each request so the test can answer it. */
let requests: Request[] = [];
let cleared: number[] = [];

function installGeolocation() {
  requests = [];
  cleared = [];
  let nextId = 1;
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition(
        success: PositionCallback,
        error?: PositionErrorCallback | null,
        options?: PositionOptions,
      ) {
        requests.push({ success, error, options });
      },
      watchPosition(
        success: PositionCallback,
        error?: PositionErrorCallback | null,
        options?: PositionOptions,
      ) {
        const watchId = nextId++;
        requests.push({ success, error, options, watchId });
        return watchId;
      },
      clearWatch(id: number) {
        cleared.push(id);
      },
    },
  });
}

function position(latitude: number, longitude: number): GeolocationPosition {
  return {
    coords: { latitude, longitude, accuracy: 10 },
    timestamp: Date.now(),
  } as GeolocationPosition;
}

/** A browser error: code 1 is permission denied, 2 position unavailable, 3 timeout. */
function failure(code: number, message: string): GeolocationPositionError {
  return { code, message, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
}

function answer(request: Request | undefined, latitude: number, longitude: number) {
  act(() => {
    request?.success(position(latitude, longitude));
  });
}

beforeEach(() => {
  installGeolocation();
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "geolocation");
});

describe("useGeolocation", () => {
  it("asks for the position once, and is pending until the browser answers", () => {
    const { result } = renderHook(() => useGeolocation());
    expect(result.current).toMatchObject({ status: "pending", position: null, error: null });
    expect(requests).toHaveLength(1);

    answer(requests[0], 30.05, 31.25);

    expect(result.current.status).toBe("success");
    expect(result.current.position?.coords).toMatchObject({ latitude: 30.05, longitude: 31.25 });
  });

  it("reports the browser's error, such as permission denied", () => {
    const { result } = renderHook(() => useGeolocation());

    act(() => {
      requests[0]?.error?.(failure(1, "User denied Geolocation"));
    });

    expect(result.current).toMatchObject({ status: "error", position: null });
    expect(result.current.error?.code).toBe(1);
  });

  it("with watch, follows the position, keeps the last one after an error, and stops on unmount", () => {
    const { result, unmount } = renderHook(() => useGeolocation({ watch: true }));
    const watch = requests[0];
    expect(watch?.watchId).toBeDefined();

    answer(watch, 1, 1);
    answer(watch, 2, 2);
    expect(result.current.position?.coords.latitude).toBe(2);

    act(() => {
      watch?.error?.(failure(2, "Position unavailable"));
    });
    expect(result.current).toMatchObject({ status: "error" });
    expect(result.current.position?.coords.latitude).toBe(2);

    unmount();
    expect(cleared).toEqual([watch?.watchId]);
  });

  it("ignores an answer that arrives after it unmounts", () => {
    const errors = vi.spyOn(console, "error");
    const { unmount } = renderHook(() => useGeolocation());

    unmount();
    answer(requests[0], 3, 3);

    expect(errors).not.toHaveBeenCalled();
  });

  it("is idle and asks nothing while enabled is false, and asks once enabled", () => {
    const { result, rerender } = renderHook(({ enabled }) => useGeolocation({ enabled }), {
      initialProps: { enabled: false },
    });
    expect(result.current.status).toBe("idle");
    expect(requests).toHaveLength(0);

    rerender({ enabled: true });

    expect(result.current.status).toBe("pending");
    expect(requests).toHaveLength(1);
  });

  it("stops watching when disabled, keeping the last position", () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useGeolocation({ enabled, watch: true }),
      { initialProps: { enabled: true } },
    );
    answer(requests[0], 5, 5);

    rerender({ enabled: false });

    expect(cleared).toHaveLength(1);
    expect(result.current.status).toBe("success");
    expect(result.current.position?.coords.latitude).toBe(5);
  });

  it("passes the position options to the browser", () => {
    renderHook(() => useGeolocation({ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }));

    expect(requests[0]?.options).toEqual({
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });
  });

  it("asks again when the options change, pending meanwhile but keeping the last position", () => {
    const { result, rerender } = renderHook(
      ({ enableHighAccuracy }) => useGeolocation({ enableHighAccuracy }),
      { initialProps: { enableHighAccuracy: false } },
    );
    answer(requests[0], 6, 6);

    rerender({ enableHighAccuracy: true });

    expect(requests).toHaveLength(2);
    expect(result.current.status).toBe("pending");
    expect(result.current.position?.coords.latitude).toBe(6);
  });

  it("is unsupported where the browser has no Geolocation API", () => {
    Reflect.deleteProperty(navigator, "geolocation");

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.status).toBe("unsupported");
  });

  it("renders on the server as pending, or idle when disabled", () => {
    function Probe({ enabled }: { enabled: boolean }) {
      return useGeolocation({ enabled }).status;
    }

    expect(renderOnServer(createElement(Probe, { enabled: true }))).toBe("pending");
    expect(renderOnServer(createElement(Probe, { enabled: false }))).toBe("idle");
  });
});
