import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M2 3.993A1 1 0 012.992 3h18.016c.548 0 .992.445.992.993v16.014a1 1 0 01-.992.993H2.992A.993.993 0 012 20.007V3.993zM6 15v2h12v-2H6zm0-8v6h6V7H6zm8 0v2h4V7h-4zm0 4v2h4v-2h-4zM8 9h2v2H8V9z" />
  </svg>
);
