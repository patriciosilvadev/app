import React from "react";
export function XSquare(props) {
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
      className="x-square_svg__feather x-square_svg__feather-x-square"
      {...props}
    >
      <rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}
