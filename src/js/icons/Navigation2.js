import React from "react";
export function Navigation2(props) {
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
      className="navigation-2_svg__feather navigation-2_svg__feather-navigation-2"
      {...props}
    >
      <path d="M12 2l7 19-7-4-7 4 7-19z" />
    </svg>
  );
}
