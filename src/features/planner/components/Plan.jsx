import Canvas from "./Canvas/Canvas";
import { Palette } from "./Palette/Palette";
import { PropertiesPanel } from "./PropertiesPanel/PropertiesPanel";
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
