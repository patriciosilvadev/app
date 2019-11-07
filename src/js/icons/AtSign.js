import React from "react";
export function AtSign(props) {
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
      className="at-sign_svg__feather at-sign_svg__feather-at-sign"
      {...props}
    >
      <circle cx={12} cy={12} r={4} />
      <path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94" />
    </svg>
  );
}
