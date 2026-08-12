import { useBatchProgress, type BatchProgress } from '../../hooks/useBatchProgress'
import { TIMELINE, TIMELINE_CAPTION_BASELINE, rem, timelineSegments } from './twinLayout'

/**
 * 배치 진척 스트립 — 스테이션 줄 아래.
 *
 * 배치 하나가 칸 하나다. 왼쪽부터 차오르는 모습이 곧 공정 전체의 진척이고, 진행 중인
 * 칸이 지금 라인이 붙들고 있는 배치다. 셀 단위(퍽)와 결과 단위(배출함) 사이에서
 * 비어 있던 배치 축을 채운다.
 *
 * 배치가 많아 칸이 서로 붙을 지경이면 칸을 포기하고 비율만 보여주는 막대로 내려간다 —
 * 셀 수 없는 칸을 그리느니 비율을 정확히 보여주는 편이 낫다.
 */
function TwinBatchTimeline() {
  const { batches, doneCount } = useBatchProgress()
  const segments = timelineSegments(batches.length)

  return (
    <div className="twin-timeline">
      <span
        className="twin-timeline__caption"
        style={{ left: rem(TIMELINE.x), top: rem(TIMELINE_CAPTION_BASELINE) }}
      >
        배치 진행
      </span>
      <span
        className="twin-timeline__count"
        style={{ left: rem(TIMELINE.x + TIMELINE.w), top: rem(TIMELINE_CAPTION_BASELINE) }}
      >
        {batches.length > 0 ? `완료 ${doneCount} / ${batches.length} 배치` : '배치 없음'}
      </span>

      <div
        className="twin-timeline__track"
        style={{
          left: rem(TIMELINE.x),
          top: rem(TIMELINE.y),
          width: rem(TIMELINE.w),
          height: rem(TIMELINE.h),
          gap: segments ? rem(segments.gap) : undefined,
        }}
      >
        {segments
          ? batches.map((batch) => <BatchSegment key={batch.batchId} batch={batch} width={segments.width} />)
          : batches.length > 0 && <AggregateBar batches={batches} />}
      </div>
    </div>
  )
}

function BatchSegment({ batch, width }: { batch: BatchProgress; width: number }) {
  return (
    <div
      className={`twin-timeline__segment twin-timeline__segment--${batch.phase}`}
      style={{ width: rem(width) }}
      title={`Batch #${batch.batchId} · ${batch.completed}/${batch.total} 셀 완료`}
    />
  )
}

/** 칸을 그릴 수 없을 만큼 배치가 많을 때의 대체 표현 — 단계별 비율만 이어 붙인다 */
function AggregateBar({ batches }: { batches: BatchProgress[] }) {
  const total = batches.length
  const done = batches.filter((b) => b.phase === 'done').length
  const active = batches.filter((b) => b.phase === 'active').length

  const doneW = (done / total) * TIMELINE.w
  const activeW = (active / total) * TIMELINE.w

  return (
    <>
      <div className="twin-timeline__segment twin-timeline__segment--done" style={{ width: rem(doneW) }} />
      <div className="twin-timeline__segment twin-timeline__segment--active" style={{ width: rem(activeW) }} />
    </>
  )
}

export { TwinBatchTimeline }
