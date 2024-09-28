"use client";

import React from "react";
import PropTypes from 'prop-types';
import { ThemeProvider } from "next-themes";

const Providers = ({ children }) => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    {children}
  </ThemeProvider>
);

Providers.propTypes = {
  children: PropTypes.node.isRequired, // or PropTypes.node for optional
};

export default Providers;