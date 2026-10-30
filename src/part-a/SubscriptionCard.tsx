import { useCallback, useEffect, useRef, useState } from "react";
import { getSubscription, skipNextShipment } from "../api/mockApi";
import { ApiError, type Subscription, type SubscriptionItem } from "../api/types";
import "./SubscriptionCard.css";

const DAY_MS = 24 * 60 * 60 * 1000;
const dateFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const moneyFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const formatDate = (iso: string) => dateFormat.format(new Date(iso));
const formatMoney = (cents: number) => moneyFormat.format(cents / 100);

type Notice = { kind: "skipped"; from: string; to: string } | { kind: "conflict" } | { kind: "skip-failed" };

type Step = "idle" | "confirming" | "skipping" | "refreshing";

type State =
  | { kind: "loading" }
  | { kind: "load-failed" }
  | { kind: "ready"; sub: Subscription; step: Step; notice: Notice | null };

const statusLabel = { active: "Active", paused: "Paused", cancelled: "Cancelled" } as const;

export function SubscriptionCard() {
  const [state, setState] = useState<State>({ kind: "loading" });
  // Every request takes a ticket number. Only the newest ticket may update the screen,
  // so a slow, outdated response can never overwrite newer data.
  const latestTicket = useRef(0);

  const load = useCallback(async (notice: Notice | null = null) => {
    const ticket = ++latestTicket.current;
    try {
      const sub = await getSubscription();
      if (ticket === latestTicket.current) setState({ kind: "ready", sub, step: "idle", notice });
    } catch {
      if (ticket === latestTicket.current) setState({ kind: "load-failed" });
    }
  }, []);

  useEffect(() => {
    load();
    // Invalidate the in-flight request on unmount (and on StrictMode's dev re-run).
    return () => {
      latestTicket.current++;
    };
  }, [load]);

  // Move focus with the flow: into the confirmation when it opens, back to the skip button when it closes.
  const step = state.kind === "ready" ? state.step : null;
  const previousStep = useRef(step);
  const skipButton = useRef<HTMLButtonElement>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (step === "confirming") keepButton.current?.focus();
    else if (step === "idle" && previousStep.current && previousStep.current !== "idle") skipButton.current?.focus();
    previousStep.current = step;
  }, [step]);

  async function confirmSkip(sub: Subscription) {
    // The button is also disabled while skipping; this guard makes a double click a no-op.
    if (state.kind !== "ready" || state.step !== "confirming" || !sub.nextChargeAt) return;
    const from = sub.nextChargeAt;
    setState({ kind: "ready", sub, step: "skipping", notice: null });
    const ticket = ++latestTicket.current;
    try {
      const updated = await skipNextShipment({ subscriptionId: sub.id, expectedUpdatedAt: sub.updatedAt });
      if (ticket !== latestTicket.current) return;
      setState({ kind: "ready", sub: updated, step: "idle", notice: { kind: "skipped", from, to: updated.nextChargeAt ?? from } });
    } catch (error) {
      if (ticket !== latestTicket.current) return;
      if (error instanceof ApiError && error.status === 409) {
        // Close the confirmation, load the latest data, and let the customer decide again. No automatic retry.
        setState({ kind: "ready", sub, step: "refreshing", notice: null });
        load({ kind: "conflict" });
      } else {
        setState({ kind: "ready", sub, step: "idle", notice: { kind: "skip-failed" } });
      }
    }
  }

  if (state.kind === "loading") {
    return (
      <section className="sub-card" aria-busy="true" aria-labelledby="sub-title">
        <h2 id="sub-title" className="sub-title">Your subscription</h2>
        <p className="sub-muted">Loading your subscription…</p>
        <div className="sub-skeleton sub-skeleton--tall" />
        <div className="sub-skeleton" />
        <div className="sub-skeleton" />
      </section>
    );
  }

  if (state.kind === "load-failed") {
    return (
      <section className="sub-card" aria-labelledby="sub-title">
        <h2 id="sub-title" className="sub-title">Your subscription</h2>
        <p role="alert" className="sub-notice sub-notice--warning">
          We couldn't load your subscription. Please check your connection and try again.
        </p>
        <button
          className="sub-btn sub-btn--primary"
          onClick={() => {
            setState({ kind: "loading" });
            load();
          }}
        >
          Try again
        </button>
      </section>
    );
  }

  const { sub, notice } = state;
  const isActive = sub.status === "active" && sub.nextChargeAt !== null && sub.nextChargeTotalCents !== null;

  return (
    <section className={`sub-card sub-card--${sub.status}`} aria-labelledby="sub-title">
      <header className="sub-header">
        <h2 id="sub-title" className="sub-title">Your subscription</h2>
        <span className={`sub-badge sub-badge--${sub.status}`}>{statusLabel[sub.status]}</span>
      </header>
      <p className="sub-muted">
        Every {sub.intervalDays} days · {sub.discountPercent}% subscriber discount
      </p>

      {isActive ? (
        <div className="sub-next">
          <p className="sub-label">Next charge</p>
          <p className="sub-next-date">{formatDate(sub.nextChargeAt!)}</p>
          <p className="sub-next-amount">{formatMoney(sub.nextChargeTotalCents!)}</p>
        </div>
      ) : (
        <p className="sub-status-summary">
          {sub.status === "paused"
            ? `Paused${sub.pausedUntil ? ` until ${formatDate(sub.pausedUntil)}` : ""}. You won't be charged or sent anything while it's paused.`
            : `Cancelled${sub.cancelledAt ? ` on ${formatDate(sub.cancelledAt)}` : ""}. You won't be charged again.`}
        </p>
      )}

      <p className="sub-label">{isActive ? "In your next shipment" : "Items in this subscription"}</p>
      <ul className="sub-items">
        {sub.items.map((item) => (
          <Item key={item.sku} item={item} />
        ))}
      </ul>

      <div role="status" className="sub-notice-region">
        {notice && <NoticeMessage notice={notice} />}
      </div>

      {isActive &&
        (state.step === "confirming" || state.step === "skipping" ? (
          <div className="sub-confirm" role="group" aria-labelledby="sub-confirm-title" aria-busy={state.step === "skipping"}>
            <p id="sub-confirm-title" className="sub-confirm-title">
              Skip the shipment on {formatDate(sub.nextChargeAt!)}?
            </p>
            <p>
              You won't be charged or sent anything on that date. Your next charge will be{" "}
              <strong>{formatMoney(sub.nextChargeTotalCents!)}</strong> on{" "}
              <strong>{formatDate(new Date(Date.parse(sub.nextChargeAt!) + sub.intervalDays * DAY_MS).toISOString())}</strong>.
            </p>
            <div className="sub-actions">
              <button className="sub-btn sub-btn--primary" disabled={state.step === "skipping"} onClick={() => confirmSkip(sub)}>
                {state.step === "skipping" ? "Skipping…" : "Yes, skip it"}
              </button>
              <button
                ref={keepButton}
                className="sub-btn sub-btn--secondary"
                disabled={state.step === "skipping"}
                onClick={() => setState({ kind: "ready", sub, step: "idle", notice: null })}
              >
                Keep my shipment
              </button>
            </div>
          </div>
        ) : (
          <button
            ref={skipButton}
            className="sub-btn sub-btn--secondary"
            disabled={state.step === "refreshing"}
            onClick={() => setState({ kind: "ready", sub, step: "confirming", notice: null })}
          >
            {state.step === "refreshing" ? "Loading the latest details…" : "Skip next shipment"}
          </button>
        ))}
    </section>
  );
}

function Item({ item }: { item: SubscriptionItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <li className="sub-item">
      {item.imageUrl && !imageFailed ? (
        <img className="sub-item-image" src={item.imageUrl} alt="" width={48} height={48} onError={() => setImageFailed(true)} />
      ) : (
        <span className="sub-item-image sub-item-image--placeholder" aria-hidden="true">
          {item.name.charAt(0)}
        </span>
      )}
      <span className="sub-item-name">{item.name}</span>
      <span className="sub-item-qty" aria-hidden="true">
        ×{item.quantity}
      </span>
      <span className="sub-visually-hidden">, quantity {item.quantity}</span>
    </li>
  );
}

function NoticeMessage({ notice }: { notice: Notice }) {
  if (notice.kind === "skipped") {
    return (
      <p className="sub-notice sub-notice--success">
        Done. You skipped the shipment on {formatDate(notice.from)}. Your next charge is now on {formatDate(notice.to)}.
      </p>
    );
  }
  if (notice.kind === "conflict") {
    return (
      <p className="sub-notice sub-notice--warning">
        Your subscription was changed somewhere else, so nothing was skipped. We've loaded the latest details above. Please
        check them and try again.
      </p>
    );
  }
  return (
    <p className="sub-notice sub-notice--warning">
      We couldn't skip your shipment, so nothing has changed. Please try again.
    </p>
  );
}
