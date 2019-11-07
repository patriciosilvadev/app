import React from "react";
export function ZapOff(props) {
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
      className="zap-off_svg__feather zap-off_svg__feather-zap-off"
      {...props}
    >
      <path d="M12.41 6.75L13 2l-2.43 2.92M18.57 12.91L21 10h-5.34M8 8l-5 6h9l-1 8 5-6M1 1l22 22" />
    </svg>
  );
}
