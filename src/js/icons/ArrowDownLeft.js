import React from "react";
export function ArrowDownLeft(props) {
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
      className="arrow-down-left_svg__feather arrow-down-left_svg__feather-arrow-down-left"
      {...props}
    >
      <path d="M17 7L7 17M17 17H7V7" />
    </svg>
  );
}
