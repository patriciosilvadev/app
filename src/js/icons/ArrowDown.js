import React from "react";
export function ArrowDown(props) {
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
      className="arrow-down_svg__feather arrow-down_svg__feather-arrow-down"
      {...props}
    >
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}
