import React from "react";
export function ChevronLeft(props) {
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
      className="chevron-left_svg__feather chevron-left_svg__feather-chevron-left"
      {...props}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
