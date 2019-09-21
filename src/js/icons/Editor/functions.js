import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M5 18l7.68-6L5 6V4h14v2H8.263L16 12l-7.737 6H19v2H5v-2z" />
  </svg>
);
