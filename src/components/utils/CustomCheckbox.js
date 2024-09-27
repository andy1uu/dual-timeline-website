import React from "react";
import { Checkbox, Field, Label  } from "@headlessui/react";

const CustomCheckbox = ({ checked, setChecked, label }) => {
  return (
    <Field className="flex lg:text-xs w-full text-primary rounded justify-between">
            <Label>{label}</Label>
      <Checkbox
        checked={checked}
        onChange={setChecked}
        className="group block size-4 rounded border bg-white data-[checked]:bg-primary"
      >
        <svg className="stroke-white opacity-0 group-data-[checked]:opacity-100" viewBox="0 0 16 16" fill="none">
          <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Checkbox>
    </Field>
  );
};

export default CustomCheckbox;
