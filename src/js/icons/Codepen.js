import React from "react";
export function Codepen(props) {
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
      className="codepen_svg__feather codepen_svg__feather-codepen"
      {...props}
    >
      <path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2zM12 22v-6.5" />
      <path d="M22 8.5l-10 7-10-7" />
      <path d="M2 15.5l10-7 10 7M12 2v6.5" />
    </svg>
  );
}
