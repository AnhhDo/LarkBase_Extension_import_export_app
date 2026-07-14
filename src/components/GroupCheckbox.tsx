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
}

const GroupCheckbox = ({ fieldList }: GroupCheckboxProps) => {
  return (
    <FieldSet>
      <FieldLabel>Trường xuất</FieldLabel>
      <FieldDescription>
        Chọn các trường bạn muốn xuất thành file excel
      </FieldDescription>
      <FieldGroup>
        <Button size="sm" variant="outline">
          Chọn hết
        </Button>
        {fieldList.map((field) => (
          <Field orientation={"horizontal"} id={field.id}>
            <Checkbox id={field.id} name={field.name} />
            <FieldLabel htmlFor={field.name} className="font-normal">
              {field.name}
            </FieldLabel>
          </Field>
        ))}
      </FieldGroup>
    </FieldSet>
  );
};

export default GroupCheckbox;
