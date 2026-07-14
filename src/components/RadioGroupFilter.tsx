import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const RadioGroupFilter = () => {
  return (
    <div>
      <h4>Chọn bộ lọc</h4>
      <RadioGroup defaultValue="option-one">
        <div className="flex items-center gap-3">
          <RadioGroupItem value="option-one" id="option-one" />
          <Label htmlFor="option-one">Toàn bộ record</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem value="option-two" id="option-two" />
          <Label htmlFor="option-two">Theo view</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem value="option-three" id="option-three" />
          <Label htmlFor="option-three">Tự tạo bộ lọc</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default RadioGroupFilter;
