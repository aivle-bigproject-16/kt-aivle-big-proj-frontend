/* 결함 유형 코드 → 한글 라벨.
   리포트(일일 리포트 결함 분포)와 시뮬레이션(탐지 카드) 두 feature 가 함께 쓰므로
   shared 로 올린다. 매핑에 없는 코드는 호출부에서 원본 코드를 그대로 보여준다. */
export const DEFECT_TYPE_LABEL: Record<string, string> = {
  MICRO_DEFECT: '미세결함',
  CRACK: '갈라짐',
  CONTAMINATION: '오염',
  SPOT: '오점',
}

export function defectTypeLabel(defectType: string): string {
  return DEFECT_TYPE_LABEL[defectType] ?? defectType
}
