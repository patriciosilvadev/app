import React from "react";
export function AlertCircle(props) {
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
      className="alert-circle_svg__feather alert-circle_svg__feather-alert-circle"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}
