import { Select as BaseSelect } from "@base-ui/react/select";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
}

export function Select({ value, onValueChange, options }: SelectProps) {
  return (
    <BaseSelect.Root
      value={value}
      onValueChange={(newValue) => {
        if (newValue !== null) {
          onValueChange(newValue);
        }
      }}
    >
      <BaseSelect.Trigger className="w-full px-2 py-1.5 text-sm bg-gray-100 rounded-lg flex items-center justify-between focus:outline-none">
        <BaseSelect.Value placeholder="Select..." />
        <BaseSelect.Icon>
          <ChevronDown size={14} className="text-gray-500" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4}>
          <BaseSelect.Popup className="z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[var(--anchor-width)]">
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                className="px-2 py-1.5 text-sm text-gray-700 rounded flex items-center justify-between cursor-pointer hover:bg-gray-100 data-[highlighted]:bg-gray-100 outline-none"
              >
                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                <BaseSelect.ItemIndicator>
                  <Check size={14} />
                </BaseSelect.ItemIndicator>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
