import React from "react";
export function Anchor(props) {
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
      className="anchor_svg__feather anchor_svg__feather-anchor"
      {...props}
    >
      <circle cx={12} cy={5} r={3} />
      <path d="M12 22V8M5 12H2a10 10 0 0020 0h-3" />
    </svg>
  );
}
