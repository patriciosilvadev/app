import React from "react";
export function Frown(props) {
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
      className="frown_svg__feather frown_svg__feather-frown"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" />
    </svg>
  );
}
