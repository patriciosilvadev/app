import React from "react";
export function Disc(props) {
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
      className="disc_svg__feather disc_svg__feather-disc"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <circle cx={12} cy={12} r={3} />
    </svg>
  );
}
