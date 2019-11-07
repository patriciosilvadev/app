import React from "react";
export function GitPullRequest(props) {
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
      className="git-pull-request_svg__feather git-pull-request_svg__feather-git-pull-request"
      {...props}
    >
      <circle cx={18} cy={18} r={3} />
      <circle cx={6} cy={6} r={3} />
      <path d="M13 6h3a2 2 0 012 2v7M6 9v12" />
    </svg>
  );
}
