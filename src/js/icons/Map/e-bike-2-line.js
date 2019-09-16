import React from "react";
export default props => (
  <svg viewBox="0 0 24 24" width={props.size} height={props.size} {...props}>
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M17 12a3 3 0 01-3 3h-2a3 3 0 01-3-3H4v3.354A4.002 4.002 0 0110.874 17h4.252a4.002 4.002 0 014.568-2.94L17.853 9H17v3zm-2 0V3h-3V1h4a1 1 0 011 1v1h5v6h-2.019l2.746 7.544a4 4 0 01-7.6 2.456h-4.253a4.002 4.002 0 01-7.8-.226A2 2 0 012 17V7a1 1 0 011-1h7a1 1 0 011 1v5a1 1 0 001 1h2a1 1 0 001-1zm-6-2V8H4v2h5zm11.864 7.271a2 2 0 10.016.044l-.016-.044zM17 7h3V5h-3v2zM7 20a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);
