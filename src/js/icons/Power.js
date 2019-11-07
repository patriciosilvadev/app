import React from "react";
export function Power(props) {
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
      className="power_svg__feather power_svg__feather-power"
      {...props}
    >
      <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
    </svg>
  );
}
