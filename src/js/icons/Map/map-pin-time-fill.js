import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M13 11V6h-2v7h6v-2h-4zm5.364 6.364L12 23.728l-6.364-6.364a9 9 0 1112.728 0z" />
  </svg>
);
