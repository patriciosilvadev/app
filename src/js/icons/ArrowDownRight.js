import React from "react";
export function ArrowDownRight(props) {
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
      className="arrow-down-right_svg__feather arrow-down-right_svg__feather-arrow-down-right"
      {...props}
    >
      <path d="M7 7l10 10M17 7v10H7" />
    </svg>
  );
}
