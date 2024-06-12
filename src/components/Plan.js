import Canvas from "./Canvas";
import { Palette } from "./Palette";
import { PropertiesPanel } from "./PropertiesPanel";
import { HistoryTable } from "./HistoryTable";
export default function Plan() {
  return (
    <main className="mainField">
      <aside>
        <Palette />
        <PropertiesPanel />
        <HistoryTable />
      </aside>

      <Canvas />
    </main>
  );
}
