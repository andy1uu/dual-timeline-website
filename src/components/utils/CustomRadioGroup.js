import React from "react";

import PropTypes from 'prop-types';

import { Field, Label, Radio, RadioGroup } from "@headlessui/react";

const CustomRadioGroup = ({ value, setFunction, options,label }) => (
    <RadioGroup value={value} onChange={setFunction} aria-label={label} className={"flex flex-col gap-2"}>
      {options.map((option) => (
        <Field key={option} className="flex w-full justify-between">
          <Label className="flex w-4/5 text-wrap">{option}</Label>
          <Radio
            value={option}
            className="group flex size-4 items-center justify-center rounded-full border data-[checked]:bg-primary"
          >
            <span className="invisible size-3 rounded-full bg-primary group-data-[checked]:visible" />
          </Radio>
        </Field>
      ))}
    </RadioGroup>
  );

CustomRadioGroup.propTypes = {
  value: PropTypes.string.isRequired, 
  setFunction: PropTypes.func.isRequired,                                      
  options: PropTypes.array.isRequired,
  label: PropTypes.string,                                                    // `label` is a string (optional)
};

export default CustomRadioGroup;
