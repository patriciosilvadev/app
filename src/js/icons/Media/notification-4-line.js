import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M18 10a6 6 0 10-12 0v8h12v-8zm2 8.667l.4.533a.5.5 0 01-.4.8H4a.5.5 0 01-.4-.8l.4-.533V10a8 8 0 1116 0v8.667zM9.5 21h5a2.5 2.5 0 11-5 0z" />
  </svg>
);
