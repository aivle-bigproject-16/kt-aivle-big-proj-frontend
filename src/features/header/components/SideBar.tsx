import "./SideBar.css";
import { DashboardIcon, ChecklistIcon, ReportIcon, BellIcon } from "./Icons";
import { FlowCellLogo } from "./FlowCellLogo";
import { SideBarTab } from "./SideBarTab";
import { ROUTES } from "@/core/navigation/routes";
import { LegalFooter } from "@/shared/ui/LegalFooter";

/** 사이드바 — 370px 고정 폭, 흰 배경. 상단 로고 아래 전체 폭 텍스트+아이콘 내비게이션 목록.
   선택된 항목은 옅은 파란 배경 밴드로 강조된다. LegalFooter는 margin-top:auto로
   나머지 세로 공간을 다 밀어내고 맨 아래에 붙는다 */
function SideBar() {
  return (
    <nav className="side-bar">
      <div className="side-bar__logo">
        <FlowCellLogo />
      </div>

      <ul className="side-bar__nav">
        <SideBarTab icon={<DashboardIcon />} label="대시보드" to={ROUTES.DASHBOARD} />
        <SideBarTab icon={<ChecklistIcon />} label="배터리 목록" to={ROUTES.BATTERY} />
        <SideBarTab icon={<ReportIcon />} label="리포트 목록" to={ROUTES.REPORT_DAILY} matchPrefix="/reports" />
        <SideBarTab icon={<BellIcon />} label="공지사항" to={ROUTES.NOTICE} matchPrefix="/notices" />
      </ul>

      <LegalFooter />
    </nav>
  );
}

export { SideBar };
