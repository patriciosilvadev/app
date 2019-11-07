import React from "react";
export function ChevronsLeft(props) {
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
      className="chevrons-left_svg__feather chevrons-left_svg__feather-chevrons-left"
      {...props}
    >
      <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
    </svg>
  );
}
