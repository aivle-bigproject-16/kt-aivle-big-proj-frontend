import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";

type SideBarTabProps = {
    icon: ReactNode;
    label?: string;
    to: string;
    active?: boolean;
    matchPrefix?: string;
};

function SideBarTab({ icon, label, to, matchPrefix }: SideBarTabProps) {
    const { pathname } = useLocation();
    const isPrefixActive = matchPrefix ? pathname.startsWith(matchPrefix) : false;

    return (
        <li>
          <NavLink
            to={to}
            className={({ isActive }) =>
              (isActive || isPrefixActive)
                ? 'side-bar__nav-item side-bar__nav-item--active'
                : 'side-bar__nav-item'
            }
          >
            <span className="side-bar__nav-item-icon">{icon}</span>
            <span className="side-bar__nav-item-label">{label}</span>
          </NavLink>
        </li>
    );
}

export { SideBarTab };
