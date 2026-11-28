import { useSessionStorage } from "react-honey-hooks";

const lastStep = 3;

/** A checkout that remembers its step after a reload, but only in this tab. */
export default function UseSessionStorageDemo() {
  const [step, setStep, startOver] = useSessionStorage("react-honey-hooks-docs:checkout-step", 1);

  return (
    <div>
      <p role="status">
        Checkout step {step} of {lastStep}
      </p>
      <div className="button-group">
        <button
          type="button"
          className="button button--primary"
          disabled={step >= lastStep}
          onClick={() => {
            setStep((current) => current + 1);
          }}
        >
          Continue
        </button>
        <button
          type="button"
          className="button button--outline button--secondary"
          onClick={startOver}
        >
          Start over
        </button>
      </div>
      <p className="margin-top--sm">
        Reload the page: the step stays. Open a new tab: it starts again.
      </p>
    </div>
  );
}
