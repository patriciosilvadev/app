import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12 14v5.5L1.5 11 12 2.5V8c5.523 0 10 4.477 10 10 0 .273-.01.543-.032.81A8.999 8.999 0 0014 14h-2zm-2 1.308V12h4c1.42 0 2.791.271 4.057.773A7.982 7.982 0 0012 10h-2V6.692L4.679 11 10 15.308z" />
  </svg>
);
