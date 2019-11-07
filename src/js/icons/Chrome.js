import React from "react";
export function Chrome(props) {
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
      className="chrome_svg__feather chrome_svg__feather-chrome"
      {...props}
    >
      <circle cx={12} cy={12} r={10} />
      <circle cx={12} cy={12} r={4} />
      <path d="M21.17 8H12M3.95 6.06L8.54 14M10.88 21.94L15.46 14" />
    </svg>
  );
}
