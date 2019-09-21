import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M20 22H6a3 3 0 01-3-3V5a3 3 0 013-3h14a1 1 0 011 1v18a1 1 0 01-1 1zm-1-2v-2H6a1 1 0 000 2h13zm-7-10a2 2 0 100-4 2 2 0 000 4zm-3 4h6a3 3 0 00-6 0z" />
  </svg>
);
