import { useOnlineStatus } from "react-honey-hooks";

/** An editor toolbar that warns you and holds off saving while the connection is down. */
export default function UseOnlineStatusDemo() {
  const online = useOnlineStatus();

  return (
    <div>
      <span role="status" className={`badge ${online ? "badge--success" : "badge--danger"}`}>
        {online ? "Online" : "Offline"}
      </span>
      {!online && (
        <div role="alert" className="alert alert--warning margin-top--sm">
          You're offline. Your changes will be saved when you reconnect.
        </div>
      )}
      <div className="margin-top--sm">
        <button type="button" className="button button--primary button--sm" disabled={!online}>
          Save
        </button>
      </div>
      <p className="margin-top--sm">
        Turn off your Wi-Fi, or go offline in your browser's dev tools.
      </p>
    </div>
  );
}
