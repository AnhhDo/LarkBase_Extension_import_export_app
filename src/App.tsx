import { useCallback, useEffect, useState } from "react";
import TabButton from "./components/TabButton";
import LarkBaseService from "./services/LarkBaseService";
import { subscribeToChanges } from "./services/LarkBaseEvents";
import ExcelService from "./services/ExcelService";

function App() {
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function load() {
      const LarkData = await LarkBaseService();
      const ExcelData = await ExcelService(LarkData);
      console.log(LarkData);
      console.log(ExcelData);
    }

    load();
  }, [reloadKey]);

  useEffect(() => subscribeToChanges(reload), [reload]);

  return (
    <div>
      <p>Export/Import test app</p>
      <TabButton key={reloadKey} />
    </div>
  );
}

export default App;