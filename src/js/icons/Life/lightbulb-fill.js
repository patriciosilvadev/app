import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M11 18H7.941c-.297-1.273-1.637-2.314-2.187-3a8 8 0 1112.49.002c-.55.685-1.888 1.726-2.185 2.998H13v-5h-2v5zm5 2v1a2 2 0 01-2 2h-4a2 2 0 01-2-2v-1h8z" />
  </svg>
);
