import React from "react";
export function Repeat(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={props.size}
      height={props.size}
      fill="none"
      stroke={props.color}
      strokeWidth={props.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="repeat_svg__feather repeat_svg__feather-repeat"
      {...props}
    >
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}
