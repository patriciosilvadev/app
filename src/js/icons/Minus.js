import React from "react";
export function Minus(props) {
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
      className="minus_svg__feather minus_svg__feather-minus"
      {...props}
    >
      <path d="M5 12h14" />
    </svg>
  );
}
