import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M21 4H7a2 2 0 100 4h14v13a1 1 0 01-1 1H7a4 4 0 01-4-4V6a4 4 0 014-4h13a1 1 0 011 1v1zM5 18a2 2 0 002 2h12V10H7a3.982 3.982 0 01-2-.535V18zM20 7H7a1 1 0 110-2h13v2z" />
  </svg>
);
