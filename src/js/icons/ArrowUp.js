import React from "react";
export function ArrowUp(props) {
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
      className="arrow-up_svg__feather arrow-up_svg__feather-arrow-up"
      {...props}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
