import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import SelectTable from "./SelectTable";
import GroupCheckbox from "./GroupCheckbox";
import RadioGroupFilter from "./RadioGroupFilter";
import { FileDropzone } from "./FileDropZone";

const TabButton = () => {
  return (
    <Tabs defaultValue="import">
      <TabsList>
        <TabsTrigger value="import">Import</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
      </TabsList>
      <TabsContent value="import">
        <FileDropzone/>
      </TabsContent>
      <TabsContent value="export" className="flex-col justify-items-center">
        <p>Chọn table bạn muốn export</p>

        <SelectTable />

        <Button size="sm" variant="outline">Chọn hết</Button>

        <GroupCheckbox />

        <RadioGroupFilter/>

        <Button size="lg" variant="outline">Export</Button>
      </TabsContent>
    </Tabs>
  );
};

export default TabButton;
