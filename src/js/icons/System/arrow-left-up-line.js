import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M9.414 8l8.607 8.607-1.414 1.414L8 9.414V17H6V6h11v2z" />
  </svg>
);