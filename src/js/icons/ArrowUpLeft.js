import React from "react";
export function ArrowUpLeft(props) {
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
      className="arrow-up-left_svg__feather arrow-up-left_svg__feather-arrow-up-left"
      {...props}
    >
      <path d="M17 17L7 7M7 17V7h10" />
    </svg>
  );
}
