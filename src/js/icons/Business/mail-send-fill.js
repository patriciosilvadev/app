import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M2 5.5V3.993A1 1 0 012.992 3h18.016c.548 0 .992.445.992.993v16.014a1 1 0 01-.992.993H2.992A.993.993 0 012 20.007V19h18V7.3l-8 7.2-10-9zM0 10h5v2H0v-2zm0 5h8v2H0v-2z" />
  </svg>
);
