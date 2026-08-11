import "./SideBar.css";
import { DashboardIcon, ChecklistIcon, ReportIcon, BellIcon } from "./Icons";
import logo from "@/assets/logo.png";
import { SideBarTab } from "./SideBarTab";
import { ROUTES } from "@/core/navigation/routes";

function SideBar() {
  return (
    <nav className="side-bar">
      <div className="side-bar__logo-card">
        <img src={logo} alt="로고" className="side-bar__logo-img" />
      </div>

      <div className="side-bar__pill">
        <ul className="side-bar__nav">
          <SideBarTab icon={<DashboardIcon />} label="대시보드" to={ROUTES.DASHBOARD} />
          <SideBarTab icon={<ChecklistIcon />} label="배터리 목록" to={ROUTES.BATTERY} />
          <SideBarTab icon={<ReportIcon />} label="리포트 목록" to={ROUTES.REPORT_DAILY} matchPrefix="/reports" />
          <SideBarTab icon={<BellIcon />} label="공지사항" to={ROUTES.NOTICE} matchPrefix="/notices" />
        </ul>
      </div>
    </nav>
  );
}

export { SideBar };
