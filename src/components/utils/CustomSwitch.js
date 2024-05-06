import React from "react";
import { Switch } from "@headlessui/react";

const CustomSwitch = ({ checked, setChecked, label }) => {
  return (
    <div className="flex justify-center items-center">
      <div className="">{label}</div>
      <Switch
        checked={checked}
        onChange={setChecked}
        className={`${
          checked ? "bg-primary" : "bg-gray-200"
        } relative mx-2 my-auto inline-flex h-6 w-11 items-center rounded-full`}>
        <span className="sr-only">{label}</span>
        <span
          className={`${
            checked ? "translate-x-6" : "translate-x-1"
          } inline-block h-4 w-4 transform rounded-full bg-white transition`}
        />
      </Switch>
    </div>
  );
};

export default CustomSwitch;
