import Canvas from "../Canvas/Canvas";
import { Palette } from "../Palette/Palette";
import { PropertiesPanel } from "../PropertiesPanel/PropertiesPanel";
import { HistoryTable } from "../HistoryTable/HistoryTable";
import styles from "./Plan.module.css";

export default function Plan() {
  return (
    <main className={styles.mainField}>
      <aside className={styles.leftSidebar}>
        <Palette />
        <PropertiesPanel />
        <HistoryTable />
      </aside>

      <div className={styles.content}>
        <Canvas />
      </div>
    </main>
  );
}
