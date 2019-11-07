import React from "react";
export function Battery(props) {
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
      className="battery_svg__feather battery_svg__feather-battery"
      {...props}
    >
      <rect x={1} y={6} width={18} height={12} rx={2} ry={2} />
      <path d="M23 13v-2" />
    </svg>
  );
}
