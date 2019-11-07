import React from "react";
export function SkipBack(props) {
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
      className="skip-back_svg__feather skip-back_svg__feather-skip-back"
      {...props}
    >
      <path d="M19 20L9 12l10-8v16zM5 19V5" />
    </svg>
  );
}
