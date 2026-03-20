import { useState } from "react";
import { useGardenStore } from "../../store/useGardenStore";
import styles from "./Modal.module.css";

export default function NewGardenModal({ onClose }) {
  const [gardenName, setGardenName] = useState("My garden");
  const [firstYear, setFirstYear] = useState(new Date().getFullYear());
  const [errorMessage, setErrorMessage] = useState("");
  const createNewGarden = useGardenStore((state) => state.createNewGarden);
  const gardens = useGardenStore((state) => state.gardens);

  const handleCreate = async () => {
    // Validation
    const trimmedName = gardenName?.trim();
    
    if (!trimmedName) {
      setErrorMessage("Enter the name");
      return;
    }

    const isDuplicate = gardens.some(
      (g) => g.title.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (isDuplicate) {
      setErrorMessage("A garden with this name already exists. Please choose another name.");
      return;
    }

    // Clear any previous errors
    setErrorMessage("");

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
            onChange={(e) => {
              setGardenName(e.target.value);
              if (errorMessage) setErrorMessage("");
            }}
            className={`${styles.input} ${errorMessage ? styles.inputError : ''}`}
            placeholder="My garden"
            maxLength={80}
          />
          <div className={styles.errorMessage}>
            {errorMessage}
          </div>
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
          <button 
            onClick={handleCreate} 
            className={styles.buttonPrimary}
          >
            Create garden
          </button>
        </div>
      </div>
    </div>
  );
}
