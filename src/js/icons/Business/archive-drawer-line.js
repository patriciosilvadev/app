import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M3 2.992C3 2.444 3.445 2 3.993 2h16.014a1 1 0 01.993.992v18.016a.993.993 0 01-.993.992H3.993A1 1 0 013 21.008V2.992zM19 11V4H5v7h14zm0 2H5v7h14v-7zM9 6h6v2H9V6zm0 9h6v2H9v-2z" />
  </svg>
);