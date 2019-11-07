import React from "react";
export function Calendar(props) {
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
      className="calendar_svg__feather calendar_svg__feather-calendar"
      {...props}
    >
      <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
