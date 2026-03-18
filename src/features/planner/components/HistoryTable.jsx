import { useState, useEffect } from "react";
import { useGardenStore } from "../store/useGardenStore";
import styles from "./HistoryTable.module.css";

export function HistoryTable() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVersionHistoryExpanded, setIsVersionHistoryExpanded] = useState(false);

  const gardens = useGardenStore((state) => state.gardens);
  const currentGarden = useGardenStore((state) => state.currentGarden);
  const plans = useGardenStore((state) => state.plans);
  const currentPlan = useGardenStore((state) => state.currentPlan);
  const versions = useGardenStore((state) => state.versions);
  const isPreviewMode = useGardenStore((state) => state.isPreviewMode);
  const previewVersionId = useGardenStore((state) => state.previewVersionId);

  const fetchGardens = useGardenStore((state) => state.fetchGardens);
  const selectGarden = useGardenStore((state) => state.selectGarden);
  const selectPlan = useGardenStore((state) => state.selectPlan);
  const previewVersion = useGardenStore((state) => state.previewVersion);
  const exitPreview = useGardenStore((state) => state.exitPreview);
  const restoreVersion = useGardenStore((state) => state.restoreVersion);
  const getVersionHistory = useGardenStore((state) => state.getVersionHistory);

  // Load gardens on mount and version history if plan exists
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchGardens();
        
        // If there's already a current plan (from persisted state), load its version history
        if (currentPlan?.id) {
          await getVersionHistory(currentPlan.id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchGardens, getVersionHistory, currentPlan?.id]);

  // Refresh version history when currentVersionId changes (after save)
  useEffect(() => {
    const refreshVersionHistory = async () => {
      if (currentPlan?.id && currentPlan?.currentVersionId) {
        try {
          await getVersionHistory(currentPlan.id);
        } catch (err) {
          console.error("Failed to refresh version history:", err);
        }
      }
    };
    refreshVersionHistory();
  }, [currentPlan?.currentVersionId, currentPlan?.id, getVersionHistory]);

  const handleGardenChange = async (e) => {
    const gardenId = e.target.value;
    if (!gardenId) return;

    try {
      setLoading(true);
      setError(null);
      await selectGarden(gardenId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (e) => {
    const planId = e.target.value;
    if (!planId) return;

    try {
      setLoading(true);
      setError(null);
      await selectPlan(planId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (versionId) => {
    try {
      setLoading(true);
      setError(null);
      await previewVersion(versionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId) => {
    if (!window.confirm("Restore this version? This will create a new version.")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await restoreVersion(versionId);
      alert("Version restored ✅");
    } catch (err) {
      setError(err.message);
      alert(`Failed to restore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExitPreview = () => {
    exitPreview();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const isCurrentVersion = (versionId) => {
    return currentPlan?.currentVersionId === versionId;
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>History</h2>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Garden Selector */}
      <div className={styles.section}>
        <label className={styles.label}>Garden</label>
        <select
          value={currentGarden?._id || ""}
          onChange={handleGardenChange}
          className={styles.select}
          disabled={loading}
        >
          <option value="">Select a garden</option>
          {gardens.map((garden) => (
            <option key={garden._id} value={garden._id}>
              {garden.title}
            </option>
          ))}
        </select>
      </div>

      {/* Season Selector */}
      {currentGarden && (
        <div className={styles.section}>
          <label className={styles.label}>Season</label>
          <select
            value={currentPlan?.id || ""}
            onChange={handlePlanChange}
            className={styles.select}
            disabled={loading}
          >
            <option value="">Select a season</option>
            {plans.map((plan) => (
              <option key={plan._id} value={plan._id}>
                {plan.year}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className={styles.previewBanner}>
          <div className={styles.previewText}>
            👁️ Previewing version
          </div>
          <div className={styles.previewActions}>
            <button
              onClick={() => handleRestore(previewVersionId)}
              className={styles.restoreButton}
            >
              Restore
            </button>
            <button
              onClick={handleExitPreview}
              className={styles.exitButton}
            >
              Exit preview
            </button>
          </div>
        </div>
      )}

      {/* Version List */}
      {currentPlan && (
        <div className={styles.section}>
          <div 
            className={styles.dropdownHeader}
            onClick={() => setIsVersionHistoryExpanded(!isVersionHistoryExpanded)}
          >
            <label className={styles.label}>Version History</label>
            <span className={styles.dropdownArrow}>
              {isVersionHistoryExpanded ? "▼" : "▶"}
            </span>
          </div>
          
          {isVersionHistoryExpanded && (
            <div className={styles.versionList}>
              {loading && <div className={styles.loading}>Loading...</div>}
              {!loading && versions.length === 0 && (
                <div className={styles.empty}>No versions yet</div>
              )}
              {!loading &&
                versions.map((version, index) => {
                  const isCurrent = isCurrentVersion(version._id);
                  const isPreviewing = previewVersionId === version._id;

                  return (
                    <div
                      key={version._id}
                      className={`${styles.versionItem} ${
                        isCurrent ? styles.current : ""
                      } ${isPreviewing ? styles.previewing : ""}`}
                    >
                      <div className={styles.versionHeader}>
                        <div className={styles.versionInfo}>
                          <span
                            className={`${styles.indicator} ${
                              isCurrent ? styles.indicatorCurrent : ""
                            }`}
                          >
                            {isCurrent ? "●" : "○"}
                          </span>
                          <span className={styles.versionComment}>
                            {version.comment || "Version " + (versions.length - index)}
                          </span>
                        </div>
                        <span className={styles.versionTime}>
                          {formatTime(version.createdAt)}
                        </span>
                      </div>
                      <div className={styles.versionDate}>
                        {formatDate(version.createdAt)}
                      </div>
                      {!isPreviewMode && (
                        <div className={styles.versionActions}>
                          <button
                            onClick={() => handlePreview(version._id)}
                            className={styles.previewBtn}
                            disabled={loading}
                          >
                            Preview
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => handleRestore(version._id)}
                              className={styles.restoreBtn}
                              disabled={loading}
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
