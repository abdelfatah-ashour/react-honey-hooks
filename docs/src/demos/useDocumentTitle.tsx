import { useState } from "react";
import { useDocumentTitle } from "react-honey-hooks";

/** Puts the unread count in the tab title, putting the old title back when it unmounts. */
function UnreadTitle({ unread }: { unread: number }) {
  useDocumentTitle(unread > 0 ? `(${String(unread)}) Inbox` : "Inbox", { restoreOnUnmount: true });
  return null;
}

/** An inbox that can show its unread count in the browser tab's title. */
export default function UseDocumentTitleDemo() {
  const [unread, setUnread] = useState(2);
  const [inTitle, setInTitle] = useState(false);

  return (
    <div>
      {inTitle && <UnreadTitle unread={unread} />}
      <p role="status">{unread} unread</p>
      <div className="button-group">
        <button
          type="button"
          className="button button--secondary button--sm"
          onClick={() => {
            setUnread(unread + 1);
          }}
        >
          New message
        </button>
        <button
          type="button"
          className="button button--secondary button--sm"
          onClick={() => {
            setUnread(0);
          }}
        >
          Mark all read
        </button>
        <button
          type="button"
          className={`button button--outline button--primary button--sm${inTitle ? " button--active" : ""}`}
          aria-pressed={inTitle}
          onClick={() => {
            setInTitle(!inTitle);
          }}
        >
          Show in tab title
        </button>
      </div>
    </div>
  );
}
