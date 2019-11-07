import React from "react";
export function ChevronsDown(props) {
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
      className="chevrons-down_svg__feather chevrons-down_svg__feather-chevrons-down"
      {...props}
    >
      <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
    </svg>
  );
}
