import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M2 13h6v8H2v-8zM9 3h6v18H9V3zm7 5h6v13h-6V8z" />
  </svg>
);
