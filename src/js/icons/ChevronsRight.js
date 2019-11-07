import React from "react";
export function ChevronsRight(props) {
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
      className="chevrons-right_svg__feather chevrons-right_svg__feather-chevrons-right"
      {...props}
    >
      <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
    </svg>
  );
}
