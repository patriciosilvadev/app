import React from "react";
export function ChevronsUp(props) {
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
      className="chevrons-up_svg__feather chevrons-up_svg__feather-chevrons-up"
      {...props}
    >
      <path d="M17 11l-5-5-5 5M17 18l-5-5-5 5" />
    </svg>
  );
}
