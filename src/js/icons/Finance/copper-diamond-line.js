import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zM9 8h6l2.5 3.5L12 17l-5.5-5.5L9 8zm1.03 2l-.92 1.29L12 14.18l2.89-2.89-.92-1.29h-3.94z" />
  </svg>
);