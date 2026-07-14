import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const ImportAttachment = () => {
  return (
    <div>
      <Label htmlFor="attachment">Attachments</Label>
      <Input id="attachment" type="file"></Input>
    </div>
  );
};

export default ImportAttachment;
