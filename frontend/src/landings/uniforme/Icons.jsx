import React from 'react';

// Thin 1.5px line icons from the design (navy or gold, no emoji)
const PATHS = {
    shirt: <path d="M8 3l4 2 4-2 4 4-3 3v11H7V10L4 7z" />,
    skirt: <><path d="M9 3h6l1 4 3 13H5L8 7z" /><path d="M9 7h6M8.3 11h7.4M7.6 15h8.8" /></>,
    tie: <path d="M9 3h6l-1 4 1 3-4 10-4-10 1-3z" />,
    cash: <><circle cx="12" cy="12" r="9" /><path d="M9 12.5l2 2 4-4.5" /></>,
    truck: <><path d="M2 7h11v9H2z" /><path d="M13 10h4l3 3v3h-7z" /><circle cx="6" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></>,
    swap: <><path d="M4 8h13l-3-3" /><path d="M20 16H7l3 3" /></>,
    phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
    shield: <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />,
    whatsapp: <><path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.3z" /><path d="M9 8.5c.3 2.8 2.7 5.2 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z" /></>,
    facebook: <path d="M15 8h-2c-1 0-1.5.5-1.5 1.5V11H15l-.4 3H11.5v7h-3v-7H6v-3h2.5V9c0-2.2 1.3-4 4-4H15z" />,
    plus: <path d="M12 5v14M5 12h14" />,
};

const Icon = ({ name, size = 24, color = 'currentColor', className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        focusable="false"
    >
        {PATHS[name]}
    </svg>
);

export default Icon;
