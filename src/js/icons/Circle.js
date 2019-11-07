import React from "react";
export function Circle(props) {
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
      className="circle_svg__feather circle_svg__feather-circle"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
    </svg>
  );
}
