import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M4 2h16a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1zm8 18a5 5 0 100-10 5 5 0 000 10zm0-12a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 10a3 3 0 110-6 3 3 0 010 6z" />
  </svg>
);
