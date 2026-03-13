import { useState } from "react";
import { useGardenStore } from "../../store/useGardenStore";
import styles from "./Modal.module.css";

export default function NewGardenModal({ onClose }) {
  const [gardenName, setGardenName] = useState("My garden");
  const [firstYear, setFirstYear] = useState(new Date().getFullYear());
  const createNewGarden = useGardenStore((state) => state.createNewGarden);

  const handleCreate = async () => {
    try {
      await createNewGarden({
        title: gardenName,
        firstYear: firstYear,
      });
      alert(`Garden "${gardenName}" created ✅`);
      onClose();
    } catch (error) {
      console.error("Failed to create garden:", error);
      alert(`Failed to create garden: ${error.message}`);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Create new garden</h2>

        <div className={styles.field}>
          <label>Garden name</label>
          <input
            type="text"
            value={gardenName}
            onChange={(e) => setGardenName(e.target.value)}
            className={styles.input}
            placeholder="My garden"
          />
        </div>

        <div className={styles.field}>
          <label>First season year</label>
          <input
            type="number"
            min="2000"
            max="2099"
            value={firstYear}
            onChange={(e) => setFirstYear(Number(e.target.value))}
            className={styles.input}
          />
        </div>

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.buttonSecondary}>
            Cancel
          </button>
          <button onClick={handleCreate} className={styles.buttonPrimary}>
            Create garden
          </button>
        </div>
      </div>
    </div>
  );
}
