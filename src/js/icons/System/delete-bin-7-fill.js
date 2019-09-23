import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M7 6V3a1 1 0 011-1h8a1 1 0 011 1v3h5v2h-2v13a1 1 0 01-1 1H5a1 1 0 01-1-1V8H2V6h5zm2-2v2h6V4H9z" />
  </svg>
);