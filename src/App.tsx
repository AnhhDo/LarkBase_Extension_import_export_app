import { useEffect } from "react";
import LarkBase from "./services/LarkBaseService";
import TabButton from "./components/TabButton";

function App() {
  useEffect(() => {
    async function load() {
      const data = await LarkBase();

      console.log(data);
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
