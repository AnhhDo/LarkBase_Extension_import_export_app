import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import SelectTable from "./SelectTable";
import GroupCheckbox from "./GroupCheckbox";
import RadioGroupFilter from "./RadioGroupFilter";
import { FileDropzone } from "./FileDropZone";
import LarkBase from "@/services/LarkBase";

const TabButton = () => {
  type LarkBaseData = Awaited<ReturnType<typeof LarkBase>>;
  const [data, setData] = useState<LarkBaseData | null>(null);

  useEffect(() => {
    async function load() {
      const result = await LarkBase();
      setData(result);
    }

    load();
  }, []);

  return (
    <Tabs defaultValue="import">
      <TabsList>
        <TabsTrigger value="import">Import</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
      </TabsList>
      <TabsContent value="import">
        <p>1. Export file to make changes</p>
        <Button variant="outline">Export</Button>
        <p>2. Import file to apply changes</p>
        <FileDropzone />
      </TabsContent>
      <TabsContent value="export" className="flex-col justify-items-center">
        <p>Chọn table bạn muốn export</p>

        <SelectTable tableList={data?.tableList?? []}/>

        <Button size="sm" variant="outline">
          Chọn hết
        </Button>

        <GroupCheckbox fieldList={data?.fieldList ?? []} />

        <RadioGroupFilter />

        <Button size="lg" variant="outline">
          Export
        </Button>
      </TabsContent>
    </Tabs>
  );
};

export default TabButton;
