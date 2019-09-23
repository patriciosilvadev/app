import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M3 3.993C3 3.445 3.445 3 3.993 3h16.014c.548 0 .993.445.993.993v16.014a.994.994 0 01-.993.993H3.993A.994.994 0 013 20.007V3.993zM6 17v2h12v-2H6zM5 5v2h2V5H5zm7 7a2 2 0 110-4 2 2 0 010 4zm0 2a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);