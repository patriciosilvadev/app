import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M3 13h6v-2H3V1.846a.5.5 0 01.741-.438l18.462 10.154a.5.5 0 010 .876L3.741 22.592A.5.5 0 013 22.154V13z" />
  </svg>
);
