import { useStep } from "react-honey-hooks";

const steps = ["Cart", "Shipping", "Payment"];

/** A checkout wizard whose Back and Next buttons stop at the first and last step. */
export default function UseStepDemo() {
  const { step, next, prev, isFirst, isLast } = useStep(steps.length);

  return (
    <div>
      <p role="status">
        Step {step + 1} of {steps.length}: {steps[step]}
      </p>
      <div className="button-group">
        <button
          type="button"
          className="button button--secondary"
          onClick={prev}
          disabled={isFirst}
        >
          Back
        </button>
        <button type="button" className="button button--primary" onClick={next} disabled={isLast}>
          Next
        </button>
      </div>
    </div>
  );
}
