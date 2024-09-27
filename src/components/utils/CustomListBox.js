import React, { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import {
  FaChevronDown,
} from "react-icons/fa";

const CustomListBox = ({value, setFunction, options, width}) => {
  return (
    <Listbox value={value} onChange={setFunction}>
      <div
        className={`VideoPlayer-selector`}
        >
        <Listbox.Button
          className={`relative cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary`}
          style={{ width: `${width}px` }}>
          <span className="block truncate">{value.label}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <FaChevronDown
              className="h-3 w-3"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0">
          <Listbox.Options
            className={`absolute mt-1 max-h-60 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none`}
            style={{ width: `${width}px` }}>
            {options.map((option) => (
              <Listbox.Option
                key={option.key}
                className={({ active }) =>
                  `relative w-full cursor-default select-none py-2 pl-3 ${
                    active ? "bg-primary text-white" : "text-gray-900"
                  }`
                }
                value={option}>
                {({ value }) => (
                  <span
                    className={`block truncate ${
                      value ? "font-medium" : "font-normal"
                    }`}>
                    {option.label}
                  </span>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};

export default CustomListBox;
