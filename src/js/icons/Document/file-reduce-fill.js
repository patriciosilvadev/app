import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M16 2l5 5v14.008a.993.993 0 01-.993.992H3.993A1 1 0 013 21.008V2.992C3 2.444 3.445 2 3.993 2H16zm-8 9v2h8v-2H8z" />
  </svg>
);
