import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M5.636 6.636L12 .272l6.364 6.364a9 9 0 11-12.728 0zM13 11V6.5L8.5 13H11v4.5l4.5-6.5H13z" />
  </svg>
);
