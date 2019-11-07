import React from "react";
export function StopCircle(props) {
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
      className="stop-circle_svg__feather stop-circle_svg__feather-stop-circle"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M9 9h6v6H9z" />
    </svg>
  );
}
