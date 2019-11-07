import React from "react";
export function Terminal(props) {
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
      className="terminal_svg__feather terminal_svg__feather-terminal"
      {...props}
    >
      <path d="M4 17l6-6-6-6M12 19h8" />
    </svg>
  );
}
