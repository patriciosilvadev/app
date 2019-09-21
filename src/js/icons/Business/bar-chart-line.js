import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M3 12h2v9H3v-9zm16-4h2v13h-2V8zm-8-6h2v19h-2V2z" />
  </svg>
);
