import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zm0-2a5 5 0 015 5v6a5 5 0 01-10 0V6a5 5 0 015-5zM2.192 13.962l1.962-.393a8.003 8.003 0 0015.692 0l1.962.393C20.896 18.545 16.85 22 12 22s-8.896-3.455-9.808-8.038z" />
  </svg>
);
