import PillLink from '../PillLink';

/** Stripe cancel_url target (board 03 state C). */
export default function Canceled() {
  return (
    <div className="dmv-status-page">
      <div className="dmv-status-image">
        <img
          src="/images/dmv/dmv-canceled.jpg"
          alt="A calm corner with an armchair and an olive tree"
        />
      </div>
      <h1>Your checkout wasn’t completed.</h1>
      <p className="dmv-status-meta">
        No tickets have been issued. Choose your tickets to try again — availability will be checked
        afresh.
      </p>
      <div className="dmv-status-actions">
        <PillLink href="/tickets" variant="primary-filled">
          Return to tickets
        </PillLink>
        <PillLink href="/" variant="primary">
          Back to the event
        </PillLink>
      </div>
    </div>
  );
}
