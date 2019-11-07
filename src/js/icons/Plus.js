import React from "react";
export function Plus(props) {
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
      className="plus_svg__feather plus_svg__feather-plus"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
