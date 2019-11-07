import React from "react";
export function Droplet(props) {
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
      className="droplet_svg__feather droplet_svg__feather-droplet"
      {...props}
    >
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
    </svg>
  );
}
