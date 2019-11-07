import React from "react";
export function PlusCircle(props) {
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
      className="plus-circle_svg__feather plus-circle_svg__feather-plus-circle"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
