import React from "react";
export function Check(props) {
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
      className="check_svg__feather check_svg__feather-check"
      {...props}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
