import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M2 3.993A1 1 0 012.992 3h18.016c.548 0 .992.445.992.993v16.014a1 1 0 01-.992.993H2.992A.993.993 0 012 20.007V3.993zM12 15a3 3 0 110-6 3 3 0 010 6zm0 2a5 5 0 100-10 5 5 0 000 10zm6-12v2h2V5h-2z" />
  </svg>
);
