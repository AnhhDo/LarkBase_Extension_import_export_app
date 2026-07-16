import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";

interface FieldInfo {
  id: string;
  name: string;
  type: number;
  property: unknown;
  isPrimary: boolean;
}

interface GroupCheckboxProps {
  fieldList: FieldInfo[];
  onSelectionChange?: (selectedFields: FieldInfo[]) => void;
}

const GroupCheckbox = ({
  fieldList,
  onSelectionChange,
}: GroupCheckboxProps) => {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const allChecked =
    fieldList.length > 0 && checkedIds.size === fieldList.length;

  const emitChange = (next: Set<string>) => {
    setCheckedIds(next);
    onSelectionChange?.(fieldList.filter((field) => next.has(field.id)));
  };

  const handleToggleField = (id: string, checked: boolean) => {
    const next = new Set(checkedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    emitChange(next);
  };

  const handleToggleAll = () => {
    if (allChecked) {
      emitChange(new Set());
    } else {
      emitChange(new Set(fieldList.map((f) => f.id)));
    }
  };
  return (
    <FieldSet>
      <FieldLabel>Trường xuất</FieldLabel>
      <FieldDescription>
        Chọn các trường bạn muốn xuất thành file excel
      </FieldDescription>
      <FieldGroup>
        <Button variant="outline" onClick={handleToggleAll}>
          {allChecked ? "Bỏ chọn hết" : "Chọn hết"}
        </Button>
        {fieldList.map((field) => (
          <Field orientation={"horizontal"} id={field.id}>
            <Checkbox
              id={field.id}
              name={field.name}
              checked={checkedIds.has(field.id)}
              onCheckedChange={(checked) =>
                handleToggleField(field.id, checked === true)
              }
            />
            <FieldLabel htmlFor={field.id} className="font-normal">
              {field.name}
            </FieldLabel>
          </Field>
        ))}
      </FieldGroup>
    </FieldSet>
  );
};

export default GroupCheckbox;
