import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M3 8l6.003-6h10.995C20.55 2 21 2.455 21 2.992v18.016a.993.993 0 01-.993.992H3.993A1 1 0 013 20.993V8zm7-4v5H5v11h14V4h-9z" />
  </svg>
);