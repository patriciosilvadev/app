import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1112.728 0zM11 10H8v2h3v3h2v-3h3v-2h-3V7h-2v3z" />
  </svg>
);
