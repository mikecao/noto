import { Switch as BaseSwitch } from "@base-ui/react/switch";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({ checked, onCheckedChange }: SwitchProps) {
  return (
    <BaseSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="w-9 h-5 p-0.5 bg-gray-300 rounded-full flex items-center data-[checked]:bg-gray-900 transition-colors cursor-pointer"
    >
      <BaseSwitch.Thumb className="block w-4 h-4 bg-white rounded-full shadow transition-transform data-[checked]:translate-x-4" />
    </BaseSwitch.Root>
  );
}
