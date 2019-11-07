import React from "react";
export function Lock(props) {
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
      className="lock_svg__feather lock_svg__feather-lock"
      {...props}
    >
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
