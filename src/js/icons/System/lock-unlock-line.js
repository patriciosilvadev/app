import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M7 10h13a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V11a1 1 0 011-1h1V9a7 7 0 0113.262-3.131l-1.789.894A5 5 0 007 9v1zm-2 2v8h14v-8H5zm5 3h4v2h-4v-2z" />
  </svg>
);
