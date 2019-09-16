import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M17 18v-2h.5a3.5 3.5 0 10-2.5-5.95V10a6 6 0 10-8 5.659v2.089a8 8 0 119.458-10.65A5.5 5.5 0 1117.5 18l-.5.001zm-8-2h2v4H9v-4zm4 3h2v4h-2v-4z" />
  </svg>
);
