import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M21 16l-6.003 6H4a1 1 0 01-1-1V3a1 1 0 011-1h16a1 1 0 011 1v13zm-2-1V4H5v16h9v-5h5z" />
  </svg>
);
