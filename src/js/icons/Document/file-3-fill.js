import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M21 9v11.993A1 1 0 0120.007 22H3.993A.993.993 0 013 21.008V2.992C3 2.455 3.447 2 3.998 2H14v6a1 1 0 001 1h6zm0-2h-5V2.003L21 7z" />
  </svg>
);
