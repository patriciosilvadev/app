import React from "react";
export function LifeBuoy(props) {
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
      className="life-buoy_svg__feather life-buoy_svg__feather-life-buoy"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <circle cx={12} cy={12} r={4} />
      <path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M14.83 9.17l3.53-3.53M4.93 19.07l4.24-4.24" />
    </svg>
  );
}
