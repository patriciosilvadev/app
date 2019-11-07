import React from "react";
export function ChevronUp(props) {
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
      className="chevron-up_svg__feather chevron-up_svg__feather-chevron-up"
      {...props}
    >
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}
