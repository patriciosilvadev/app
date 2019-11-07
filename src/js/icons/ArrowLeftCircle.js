import React from "react";
export function ArrowLeftCircle(props) {
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
      className="arrow-left-circle_svg__feather arrow-left-circle_svg__feather-arrow-left-circle"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M12 8l-4 4 4 4M16 12H8" />
    </svg>
  );
}
