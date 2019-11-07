import React from "react";
export function ArrowUpRight(props) {
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
      className="arrow-up-right_svg__feather arrow-up-right_svg__feather-arrow-up-right"
      {...props}
    >
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}
