import Canvas from "./Canvas";
import { Palette } from "./Palette";
import { PropertiesPanel } from "./PropertiesPanel";
export default function Plan() {
  return (
    <main className="mainField">
      <aside>
        <Palette />
        <PropertiesPanel />
      </aside>

      <Canvas />
    </main>
  );
}
