import React from "react";
export function MinusSquare(props) {
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
      className="minus-square_svg__feather minus-square_svg__feather-minus-square"
      {...props}
    >
      <rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
      <path d="M8 12h8" />
    </svg>
  );
}
