import React from "react";
export function Square(props) {
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
      className="square_svg__feather square_svg__feather-square"
      {...props}
    >
      <rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
    </svg>
  );
}
