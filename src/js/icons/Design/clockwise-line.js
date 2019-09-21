import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M20 10.586l1.828-1.829 1.415 1.415L19 14.414l-4.243-4.242 1.415-1.415L18 10.586V8a3 3 0 00-3-3h-4V3h4a5 5 0 015 5v2.586zM13 9a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V10a1 1 0 011-1h10zm-1 2H4v8h8v-8z" />
  </svg>
);
