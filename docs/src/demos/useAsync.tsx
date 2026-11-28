import { useState } from "react";
import { useAsync } from "react-honey-hooks";

const WEATHER: Record<string, string> = { cairo: "24°C and sunny", london: "12°C and rainy" };

/** Stands in for a request to a weather API: answers after 600 ms, or stops when aborted. */
function fetchWeather(signal: AbortSignal, city: string) {
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      const weather = WEATHER[city.trim().toLowerCase()];
      if (weather) resolve(`${city}: ${weather}`);
      else reject(new Error(`No weather for ${city}`));
    }, 600);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("Aborted"));
    });
  });
}

/** A weather lookup that shows loading and error states. Try Cairo, London or anywhere else. */
export default function UseAsyncDemo() {
  const [city, setCity] = useState("");
  const { status, data, error, run } = useAsync(fetchWeather);

  let message = "Enter a city to look up";
  if (status === "pending") message = "Loading…";
  if (status === "success" && data) message = data;
  if (status === "error" && error) message = error.message;

  return (
    <div>
      <input
        aria-label="City"
        placeholder="City"
        value={city}
        onChange={(event) => {
          setCity(event.target.value);
        }}
      />{" "}
      <button
        type="button"
        className="button button--secondary button--sm"
        onClick={() => void run(city)}
      >
        Look up
      </button>
      <p role="status">{message}</p>
    </div>
  );
}
