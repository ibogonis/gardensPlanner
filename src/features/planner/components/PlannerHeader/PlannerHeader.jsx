import { useState } from "react";
import { useGardenStore } from "../../store/useGardenStore";
import styles from "./PlannerHeader.module.css";
import NewSeasonModal from "./NewSeasonModal";
import NewGardenModal from "./NewGardenModal";

export default function PlannerHeader() {
  const [isEditing, setIsEditing] = useState(false);
  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [showNewGardenModal, setShowNewGardenModal] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedYear, setEditedYear] = useState("");

  const currentPlan = useGardenStore((state) => state.currentPlan);
  const currentLayout = useGardenStore((state) => state.currentLayout);
  const currentGarden = useGardenStore((state) => state.currentGarden);
  const saveCurrentPlan = useGardenStore((state) => state.saveCurrentPlan);
  
  const setLayoutName = useGardenStore((state) => state.setLayoutName);
  const setYear = useGardenStore((state) => state.setYear);
  
  const reset = useGardenStore((state) => state.reset);

  // State 1: Before first save (no plan ID or default "plan-1")
  const isBeforeFirstSave = !currentPlan?.id || currentPlan.id === "plan-1";

  const gardenName = currentLayout?.name || currentGarden?.title || "My garden";
  const seasonYear = currentPlan?.year || new Date().getFullYear();

  const handleEdit = () => {
    setEditedName(gardenName);
    setEditedYear(seasonYear);
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
  try {
    if (editedName !== gardenName) {
      setLayoutName(editedName); 
    }

    if (Number(editedYear) !== seasonYear) {
      setYear(Number(editedYear)); 
    }

    await saveCurrentPlan(); 

    setIsEditing(false);
    alert("Changes saved ✅");
  } catch (error) {
    console.error("Failed to save changes:", error);
    alert(`Failed to save changes: ${error.message}`);
    setEditedName(gardenName);
    setEditedYear(seasonYear);
  }
};

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await saveCurrentPlan();
      alert("Plan saved ✅");
    } catch (error) {
      console.error("Save failed:", error);
      alert(`Save failed ❌: ${error.message || error}`);
    }
  };

  // State 1: Before first save
  if (isBeforeFirstSave) {
    return (
      <div className={styles.header}>
        <div className={styles.fields}>
          <div className={styles.field}>
            <label>Name your garden</label>
            <input
              type="text"
              value={gardenName}
              onChange={(e) => useGardenStore.getState().setLayoutName(e.target.value)}
              className={styles.input}
              maxLength={80}
            />
          </div>
          <div className={styles.field}>
            <label>Year</label>
            <input
              type="number"
              min="2000"
              max="2099"
              step="1"
              value={seasonYear}
              onChange={(e) => useGardenStore.getState().setYear(Number(e.target.value))}
              className={styles.input}
            />
          </div>
        </div>
        <div className={styles.actions}>
          <button onClick={reset} className={styles.button}>
            Reset
          </button>
          <button onClick={handleSave} className={styles.buttonPrimary}>
            Save
          </button>
        </div>
      </div>
    );
  }

  // State 2: After first save
  const isNameEmpty = isEditing && !editedName?.trim();

  return (
    <>
      <div className={styles.header}>
        <div className={styles.leftSection}>
          <div className={styles.breadcrumb}>
            <span className={styles.gardenIcon}>🌱</span>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className={`${styles.inputInline} ${isNameEmpty ? styles.inputError : ''}`}
                  placeholder="Garden name"
                  maxLength={80}
                />
                <span className={styles.separator}>&gt;</span>
                <input
                  type="number"
                  min="2000"
                  max="2099"
                  value={editedYear}
                  onChange={(e) => setEditedYear(e.target.value)}
                  className={styles.inputInlineYear}
                />
              </>
            ) : (
              <>
                <span className={styles.gardenName}>{gardenName}</span>
                <span className={styles.separator}>&gt;</span>
                <span className={styles.year}>{seasonYear}</span>
              </>
            )}
          </div>
          
          {isEditing ? (
            <div className={styles.editActions}>
              <button onClick={handleCancelEdit} className={styles.button}>
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges} 
                className={styles.buttonPrimary}
                disabled={isNameEmpty}
                title={isNameEmpty ? "Garden name is required" : ""}
              >
                Save changes
              </button>
            </div>
          ) : (
            <button onClick={handleEdit} className={styles.buttonEdit}>
              Edit
            </button>
          )}
        </div>

        <div className={styles.centerSection}>
          {!isEditing && (
            <>
              <button
                onClick={() => setShowNewSeasonModal(true)}
                className={styles.buttonNew}
              >
                + New season
              </button>
              <button
                onClick={() => setShowNewGardenModal(true)}
                className={styles.buttonNew}
              >
                + New garden
              </button>
            </>
          )}
        </div>

        <div className={styles.rightSection}>
          {!isEditing && (
            <>
              <button onClick={reset} className={styles.button}>
                Reset
              </button>
              <button onClick={handleSave} className={styles.buttonPrimary}>
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {showNewSeasonModal && (
        <NewSeasonModal onClose={() => setShowNewSeasonModal(false)} />
      )}

      {showNewGardenModal && (
        <NewGardenModal onClose={() => setShowNewGardenModal(false)} />
      )}
    </>
  );
}
