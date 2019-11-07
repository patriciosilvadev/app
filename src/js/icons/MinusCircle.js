import React from "react";
export function MinusCircle(props) {
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
      className="minus-circle_svg__feather minus-circle_svg__feather-minus-circle"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M8 12h8" />
    </svg>
  );
}
