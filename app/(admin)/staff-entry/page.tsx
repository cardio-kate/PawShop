import { StaffLoginCard } from '@/components/auth/StaffLoginCard';

// design.md → «Страница входа администратора»: третий, отдельный от витрины и от admin-панели
// layout — без Header/Footer витрины и без сайдбара админки (см. app/(admin)/layout.tsx, общий
// для этой страницы и /admin/dashboard). Фон paw-tint во весь экран — тот же приглушённый оттенок,
// что держит About/Footer, не пустой белый экран и не повтор фона витрины.
export default function StaffEntryPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paw-tint px-md">
      <StaffLoginCard />
    </div>
  );
}
