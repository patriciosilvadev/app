import React from "react";
export function ChevronDown(props) {
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
      className="chevron-down_svg__feather chevron-down_svg__feather-chevron-down"
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
