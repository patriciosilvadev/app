import React from "react";
export function Yack(props) {
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
      {...props}
    >
      <path d="M2.625,5.195L11.192,5.195L14.526,14.653L5.966,14.653L2.625,5.195Z"/>
      <path d="M14.526,7.591L17.474,7.67L17.344,12.43L21.028,17.302L11.555,17.278"/>
      <g transform="matrix(1,0,0,1,-0.0191137,0.0705642)">
          <path d="M5.807,14.109L7.457,19.405" />
      </g>
    </svg>
  );
}
