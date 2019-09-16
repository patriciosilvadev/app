import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M5 11h14V5H5v6zm16-7v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h16a1 1 0 011 1zm-2 9H5v6h14v-6zM7 15h3v2H7v-2zm0-8h3v2H7V7z" />
  </svg>
);
