import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TableInfo {
    id: string,
    name: string
}

interface SelectTableProps {
  tableList: TableInfo[];
}

const SelectTable = ({tableList}: SelectTableProps) => {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Chọn bảng" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {tableList.map((table) => (
            <SelectItem key={table.id} value={table.name}>
              {table.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default SelectTable;
