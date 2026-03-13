import { useState } from "react";
import { useGardenStore } from "../../store/useGardenStore";
import styles from "./Modal.module.css";

export default function NewSeasonModal({ onClose }) {
  const currentPlan = useGardenStore((state) => state.currentPlan);
  const createNewSeason = useGardenStore((state) => state.createNewSeason);

  const currentYear = currentPlan?.year || new Date().getFullYear();
  const [year, setYear] = useState(currentYear + 1);
  const [layoutSource, setLayoutSource] = useState("copy");

  const handleCreate = async () => {
    try {
      await createNewSeason({
        year,
        layoutSource,
        sourceSeasonId: layoutSource === "copy" ? currentPlan.id : null,
      });
      alert(`Season ${year} created ✅`);
      onClose();
    } catch (error) {
      console.error("Failed to create season:", error);
      alert(`Failed to create season: ${error.message}`);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Create new season</h2>

        <div className={styles.field}>
          <label>Year</label>
          <input
            type="number"
            min="2000"
            max="2099"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Layout</label>
          <div className={styles.radioGroup}>
            <label className={styles.radio}>
              <input
                type="radio"
                value="copy"
                checked={layoutSource === "copy"}
                onChange={(e) => setLayoutSource(e.target.value)}
              />
              <span>Copy layout from {currentYear}</span>
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                value="empty"
                checked={layoutSource === "empty"}
                onChange={(e) => setLayoutSource(e.target.value)}
              />
              <span>Start with empty garden</span>
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.buttonSecondary}>
            Cancel
          </button>
          <button onClick={handleCreate} className={styles.buttonPrimary}>
            Create season
          </button>
        </div>
      </div>
    </div>
  );
}
