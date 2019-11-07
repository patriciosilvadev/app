import React from "react";
export function Meh(props) {
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
      className="meh_svg__feather meh_svg__feather-meh"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M8 15h8M9 9h.01M15 9h.01" />
    </svg>
  );
}
