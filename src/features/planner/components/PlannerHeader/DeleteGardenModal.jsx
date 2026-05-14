import './DeleteGardenModal.css';

export default function DeleteGardenModal({ 
    isOpen, 
    onClose, 
    isLastSeason, 
    onDeleteSeason, 
    onDeleteGarden }) {

        if (!isOpen) return null;

        const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }};
   
  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="modal">
        <button
          className="modal-close"
          onClick={onClose}
        >
          ✕
        </button>

        {isLastSeason ? (
          <>
            <h2>Delete garden?</h2>

            <p>
              This is the only season in the garden.
            </p>

            <p>
              Deleting it will permanently remove:
            </p>

            <ul>
              <li>The entire garden</li>
              <li>All seasons</li>
              <li>All version history</li>
            </ul>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                className="danger-button"
                onClick={async () => {
                  await onDeleteGarden();
                  onClose();
                }}
              >
                Delete garden
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Delete current season?</h2>

            <p>
              You can delete only this season or
              permanently remove the entire garden.
            </p>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                className="danger-button"
                onClick={async () => {
                  await onDeleteSeason();
                  onClose();
                }}
              >
                Delete season
              </button>
            </div>

            <div className="danger-zone">
              <button
                className="danger-button outlined"
                onClick={async () => {
                  await onDeleteGarden();
                  onClose();
                }}
              >
                Delete entire garden
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

