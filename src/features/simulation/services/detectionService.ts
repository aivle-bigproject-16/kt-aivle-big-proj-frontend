import { httpClient } from '@/core/api/httpClient'
import type { ApiResponse } from '@/shared/types/api'
import type { BatteryDetail } from '@/features/battery/types'

/* battery feature 의 `batteryService.getBatteryDetail` 과 같은 엔드포인트를 친다.
   feature 간 직접 import 가 금지돼 있어(ARCHITECTURE.md 의존성 방향) 서비스를 그대로
   가져다 쓸 수 없다. 두 번째 사용처가 생겼으므로 batteryService 를 shared 로 올릴지는
   팀에서 정할 사항이고, 그 전까지는 이 얇은 래퍼가 경계를 지킨다. */
export const detectionService = {
  getBatteryDetail: (batteryCellId: number) =>
    httpClient.get<ApiResponse<BatteryDetail>>(`/battery/${batteryCellId}`),
}
