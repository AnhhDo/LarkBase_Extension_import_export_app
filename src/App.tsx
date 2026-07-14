import { useEffect } from "react";
import TabButton from "./components/TabButton";
import LarkBaseService from "./services/LarkBaseService";
import ExcelService from "./services/ExcelService";

function App() {
  useEffect(() => {
    async function load() {
      const LarkData = await LarkBaseService();
      const ExcelData = await ExcelService(LarkData);
      console.log(LarkData);
      console.log(ExcelData);
      console.log(ExcelData.worksheets)
    }

    load();
  }, []);

  return (
    <div>
      <p>Export/Import test app</p>
      <TabButton/>
    </div>
  );
}

export default App;
