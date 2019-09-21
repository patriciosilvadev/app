import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12 20h8v2h-8C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10a9.956 9.956 0 01-2 6h-2.708A8 8 0 1012 20zm0-10a2 2 0 110-4 2 2 0 010 4zm-4 4a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zm-4 4a2 2 0 110-4 2 2 0 010 4z" />
  </svg>
);
