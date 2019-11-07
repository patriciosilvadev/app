import React from "react";
export function GitCommit(props) {
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
      className="git-commit_svg__feather git-commit_svg__feather-git-commit"
      {...props}
    >
      <circle cx={12} cy={12} r={4} />
      <path d="M1.05 12H7M17.01 12h5.95" />
    </svg>
  );
}
