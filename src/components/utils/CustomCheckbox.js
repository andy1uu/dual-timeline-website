import React from "react";
import PropTypes from 'prop-types';
import { Checkbox, Field, Label } from "@headlessui/react";
import { FaCircleCheck } from "react-icons/fa6";

const CustomCheckbox = ({ checked, setChecked, label }) => (
  <Field className="flex justify-between gap-1 rounded text-primary">
    <Label className="my-auto flex">{label}</Label>
    <Checkbox
      checked={checked}
      onChange={setChecked}
      className="group my-auto size-6 rounded-full bg-white data-[checked]:bg-white"
    >
      <FaCircleCheck size={24} className="hidden fill-primary group-data-[checked]:block" />
    </Checkbox>
  </Field>
);

CustomCheckbox.propTypes = {
  checked: PropTypes.bool.isRequired,
  setChecked: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

export default CustomCheckbox;
