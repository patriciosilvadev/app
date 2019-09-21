import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M6 3h7a6 6 0 110 12H8v6H6V3zm2 2v8h5a4 4 0 100-8H8z" />
  </svg>
);
