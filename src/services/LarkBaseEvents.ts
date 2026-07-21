import { bitable } from "@lark-base-open/js-sdk";

export function subscribeToChanges(onChange: () => void): () => void {
  let offFieldAdd: (() => void) | undefined;
  let offFieldModify: (() => void) | undefined;
  let offFieldDelete: (() => void) | undefined;
  let cancelled = false;

  const detachFieldListeners = () => {
    offFieldAdd?.();
    offFieldModify?.();
    offFieldDelete?.();
    offFieldAdd = offFieldModify = offFieldDelete = undefined;
  };

  async function attachFieldListeners() {
    const table = await bitable.base.getActiveTable();
    if (cancelled) return;
    detachFieldListeners();
    offFieldAdd = table.onFieldAdd(onChange);
    offFieldModify = table.onFieldModify(onChange);
    offFieldDelete = table.onFieldDelete(onChange);
  }

  attachFieldListeners();

  const offSelectionChange = bitable.base.onSelectionChange(() => {
    onChange();
    attachFieldListeners();
  });
  const offTableAdd = bitable.base.onTableAdd(onChange);
  const offTableDelete = bitable.base.onTableDelete(onChange);

  return () => {
    cancelled = true;
    detachFieldListeners();
    offSelectionChange();
    offTableAdd();
    offTableDelete();
  };
}