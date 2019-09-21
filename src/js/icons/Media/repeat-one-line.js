import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M8 20v1.932a.5.5 0 01-.82.385l-4.12-3.433A.5.5 0 013.382 18H18a2 2 0 002-2V8h2v8a4 4 0 01-4 4H8zm8-17.932a.5.5 0 01.82-.385l4.12 3.433a.5.5 0 01-.321.884H6a2 2 0 00-2 2v8H2V8a4 4 0 014-4h10V2.068zM11 8h2v8h-2v-6H9V9l2-1z" />
  </svg>
);
