import { useMemo } from "react";

// --- 인터페이스 정의 ---
interface Item {
  name: string;
  value: number;
  href: string;
}

interface LayoutItem extends Item {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  originalValue: number; // 정규화 전 원래 값 (툴팁 등에서 사용 가능)
}

interface Props {
  items: Item[];
  width: number; // Width of the treemap container in pixels
  height: number; // Height of the treemap container in pixels
  etcLabel?: string; // "etc" 블록에 표시될 레이블 (기본값: "Etc.")
}

// --- 레이아웃 계산 로직 (Pseudo Code 기반) ---
// 이 함수는 컴포넌트 외부에 두거나, 컴포넌트 내 useMemo 콜백 안에 직접 넣을 수 있습니다.
// 여기서는 명확성을 위해 별도 함수로 분리합니다.
const calculateLayout = (
  dataItems: Item[],
  canvasWidthPx: number,
  canvasHeightPx: number,
  etcLabel: string,
): {
  results: LayoutItem[];
  set_d_items_candidates_data: (Item & { originalValue: number })[];
} => {
  if (
    !dataItems ||
    dataItems.length === 0 ||
    canvasWidthPx <= 0 ||
    canvasHeightPx <= 0
  ) {
    return { results: [], set_d_items_candidates_data: [] };
  }

  const results: LayoutItem[] = [];

  // 0. 값 정규화 (총합이 1이 되도록) 및 원본 값 저장
  const totalValue = dataItems.reduce((sum, item) => sum + item.value, 0);
  if (totalValue <= 0) return { results, set_d_items_candidates_data: [] }; // 모든 값이 0 이하거나 음수면 표시할 수 없음

  const normalizedItems = dataItems.map((item) => ({
    ...item,
    originalValue: item.value,
    value: item.value / totalValue, // 정규화된 값
  }));

  // 0-1. 논리적 캔버스 크기 (Pseudo Code의 16:10 비율)
  const logicalCanvasWidth = 16.0;
  const logicalCanvasHeight = 10.0;

  // 0-0. 데이터 내림차순 정렬 (정규화된 값 기준)
  const sortedData = [...normalizedItems].sort((a, b) => b.value - a.value);

  // --- 단계 1 & 2: S_a와 S_b 분할, S_a에 데이터 배치 ---
  const set_a_items: (Item & { originalValue: number })[] = [];
  let remaining_after_a: (Item & { originalValue: number })[] = []; // set_b 후보
  let current_sum_for_a = 0.0;

  // 이 부분은 원본 pseudo code의 "전체 집합의 합의 10/16"을 전체 정규화된 합(1.0)의 10/16로 해석.
  // 또는 S_a 영역의 너비 비율 (10/16)만큼의 값을 할당한다고 볼 수도 있습니다.
  // 여기서는 S_a 영역의 너비 비율을 기준으로 값을 채웁니다.
  // S_a의 너비 비율 = 10 / (10 + 6) = 10/16
  const target_sum_for_a = 1.0 * (10.0 / 16.0);

  const temp_sorted_data = [...sortedData];
  for (const item of sortedData) {
    if (
      set_a_items.length === 0 ||
      current_sum_for_a + item.value <= target_sum_for_a + 1e-9
    ) {
      // 1e-9는 부동소수점 오차 감안
      set_a_items.push(item);
      current_sum_for_a += item.value;
      temp_sorted_data.shift();
    } else {
      break;
    }
  }
  remaining_after_a = temp_sorted_data;

  const rect_Sa_logical_x0 = 0.0;
  const rect_Sa_logical_y0 = 0.0;
  const rect_Sa_logical_width = logicalCanvasWidth * (10.0 / 16.0); // 10
  const rect_Sa_logical_height = logicalCanvasHeight; // 10

  const rect_Sb_logical_x0 = rect_Sa_logical_width;
  const rect_Sb_logical_y0 = 0.0;
  const rect_Sb_logical_width = logicalCanvasWidth * (6.0 / 16.0); // 6
  const rect_Sb_logical_height = logicalCanvasHeight; // 10

  let current_logical_x_offset_in_Sa = rect_Sa_logical_x0;
  const sum_value_set_a = set_a_items.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  if (sum_value_set_a > 0) {
    for (const item_a of set_a_items) {
      const item_a_logical_width_ratio = item_a.value / sum_value_set_a;
      const item_a_logical_width =
        rect_Sa_logical_width * item_a_logical_width_ratio;

      results.push({
        ...item_a,
        x0:
          (current_logical_x_offset_in_Sa / logicalCanvasWidth) * canvasWidthPx,
        y0: (rect_Sa_logical_y0 / logicalCanvasHeight) * canvasHeightPx,
        x1:
          ((current_logical_x_offset_in_Sa + item_a_logical_width) /
            logicalCanvasWidth) *
          canvasWidthPx,
        y1:
          ((rect_Sa_logical_y0 + rect_Sa_logical_height) /
            logicalCanvasHeight) *
          canvasHeightPx,
      });
      current_logical_x_offset_in_Sa += item_a_logical_width;
    }
  } else if (set_a_items.length > 0) {
    // 모든 값이 0인 경우 등분
    const item_a_logical_width = rect_Sa_logical_width / set_a_items.length;
    for (const item_a of set_a_items) {
      results.push({
        ...item_a,
        x0:
          (current_logical_x_offset_in_Sa / logicalCanvasWidth) * canvasWidthPx,
        y0: (rect_Sa_logical_y0 / logicalCanvasHeight) * canvasHeightPx,
        x1:
          ((current_logical_x_offset_in_Sa + item_a_logical_width) /
            logicalCanvasWidth) *
          canvasWidthPx,
        y1:
          ((rect_Sa_logical_y0 + rect_Sa_logical_height) /
            logicalCanvasHeight) *
          canvasHeightPx,
      });
      current_logical_x_offset_in_Sa += item_a_logical_width;
    }
  }

  // --- 단계 2 (S_b 분할), 3, 4, 5: S_c, S_d 분할 및 데이터 배치 ---
  const rect_Sc_logical_x0 = rect_Sb_logical_x0;
  const rect_Sc_logical_y0 = rect_Sb_logical_y0;
  const rect_Sc_logical_width = rect_Sb_logical_width; // 6
  const rect_Sc_logical_height = rect_Sb_logical_height * (6.0 / 10.0); // 6 (정사각형)

  const rect_Sd_logical_x0 = rect_Sb_logical_x0;
  const rect_Sd_logical_y0 = rect_Sc_logical_y0 + rect_Sc_logical_height; // S_c 아래
  const rect_Sd_logical_width = rect_Sb_logical_width; // 6
  const rect_Sd_logical_height = rect_Sb_logical_height * (4.0 / 10.0); // 4

  const set_b_items = [...remaining_after_a]; // sortedData에서 set_a_items를 제외한 나머지
  const set_c_items: (Item & { originalValue: number })[] = [];
  let set_d_items_candidates: (Item & { originalValue: number })[] = []; // "etc" 후보
  let current_sum_for_c = 0.0;
  const sum_value_set_b = set_b_items.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  // S_c에 할당될 값의 목표량: S_b 전체 값 중 6/10
  const target_sum_for_c =
    sum_value_set_b > 0 ? sum_value_set_b * (6.0 / 10.0) : 0;

  const temp_set_b_data = [...set_b_items];
  if (sum_value_set_b > 0) {
    for (const item_b of set_b_items) {
      if (
        set_c_items.length === 0 ||
        current_sum_for_c + item_b.value <= target_sum_for_c + 1e-9
      ) {
        set_c_items.push(item_b);
        current_sum_for_c += item_b.value;
        temp_set_b_data.shift();
      } else {
        break;
      }
    }
  }
  set_d_items_candidates = temp_set_b_data;

  let current_logical_y_offset_in_Sc = rect_Sc_logical_y0;
  const sum_value_set_c = set_c_items.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  if (sum_value_set_c > 0) {
    for (const item_c of set_c_items) {
      const item_c_logical_height_ratio = item_c.value / sum_value_set_c;
      const item_c_logical_height =
        rect_Sc_logical_height * item_c_logical_height_ratio;

      results.push({
        ...item_c,
        x0: (rect_Sc_logical_x0 / logicalCanvasWidth) * canvasWidthPx,
        y0:
          (current_logical_y_offset_in_Sc / logicalCanvasHeight) *
          canvasHeightPx,
        x1:
          ((rect_Sc_logical_x0 + rect_Sc_logical_width) / logicalCanvasWidth) *
          canvasWidthPx,
        y1:
          ((current_logical_y_offset_in_Sc + item_c_logical_height) /
            logicalCanvasHeight) *
          canvasHeightPx,
      });
      current_logical_y_offset_in_Sc += item_c_logical_height;
    }
  } else if (set_c_items.length > 0) {
    // 모든 값이 0인 경우 등분
    const item_c_logical_height = rect_Sc_logical_height / set_c_items.length;
    for (const item_c of set_c_items) {
      results.push({
        ...item_c,
        x0: (rect_Sc_logical_x0 / logicalCanvasWidth) * canvasWidthPx,
        y0:
          (current_logical_y_offset_in_Sc / logicalCanvasHeight) *
          canvasHeightPx,
        x1:
          ((rect_Sc_logical_x0 + rect_Sc_logical_width) / logicalCanvasWidth) *
          canvasWidthPx,
        y1:
          ((current_logical_y_offset_in_Sc + item_c_logical_height) /
            logicalCanvasHeight) *
          canvasHeightPx,
      });
      current_logical_y_offset_in_Sc += item_c_logical_height;
    }
  }

  // 5. S_d 는 "etc" 로 표기한다.
  const sum_value_set_d_normalized = set_d_items_candidates.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const sum_value_set_d_original = set_d_items_candidates.reduce(
    (sum, item) => sum + item.originalValue,
    0,
  );

  // S_d 영역이 유효하고, "etc"로 표시할 내용이 있거나, 혹은 항상 "etc" 영역을 표시해야 한다면.
  // 여기서는 set_d_items_candidates가 실제로 아이템을 가지고 있을 때만 "etc" 블록을 만듭니다.
  if (
    rect_Sd_logical_height > 0 &&
    rect_Sd_logical_width > 0 &&
    set_d_items_candidates.length > 0
  ) {
    results.push({
      name: etcLabel,
      value: sum_value_set_d_normalized, // 정규화된 값의 합
      originalValue: sum_value_set_d_original, // 원본 값의 합
      href: "#", // "etc"는 기본적으로 링크 없음 또는 특별한 링크
      x0: (rect_Sd_logical_x0 / logicalCanvasWidth) * canvasWidthPx,
      y0: (rect_Sd_logical_y0 / logicalCanvasHeight) * canvasHeightPx,
      x1:
        ((rect_Sd_logical_x0 + rect_Sd_logical_width) / logicalCanvasWidth) *
        canvasWidthPx,
      y1:
        ((rect_Sd_logical_y0 + rect_Sd_logical_height) / logicalCanvasHeight) *
        canvasHeightPx,
    });
  }

  return { results, set_d_items_candidates_data: set_d_items_candidates };
};

// --- React 컴포넌트 ---
export default function CustomTreemap({
  items,
  width,
  height,
  etcLabel = "Etc.",
}: Props) {
  const { layoutItems, set_d_items_candidates_from_layout } = useMemo(() => {
    const { results, set_d_items_candidates_data } = calculateLayout(
      items,
      width,
      height,
      etcLabel,
    );
    return {
      layoutItems: results,
      set_d_items_candidates_from_layout: set_d_items_candidates_data,
    };
  }, [items, width, height, etcLabel]);

  if (!items || items.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center border border-gray-300"
      >
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  return (
    <div
      style={{ width, height }}
      className="relative overflow-hidden border border-gray-200 bg-white" // 부모에 relative, overflow-hidden
    >
      {layoutItems.map((item, index) => {
        const itemWidth = item.x1 - item.x0;
        const itemHeight = item.y1 - item.y0;

        // 너비나 높이가 매우 작으면 렌더링하지 않거나 최소 크기 보장 (선택 사항)
        if (itemWidth < 1 || itemHeight < 1) {
          return null;
        }

        const isEtc = item.name === etcLabel;

        return (
          <a
            key={item.name === etcLabel ? "etc-block" : `${item.name}-${index}`} // "etc"는 고유한 키, 나머지는 이름과 인덱스 조합
            href={isEtc ? undefined : item.href} // "etc" 블록은 클릭 안되도록 href 제거
            target={isEtc ? undefined : "_blank"} // 새 탭에서 열기 (선택 사항)
            rel={isEtc ? undefined : "noopener noreferrer"}
            style={{
              position: "absolute",
              left: `${item.x0}px`,
              top: `${item.y0}px`,
              width: `${itemWidth}px`,
              height: `${itemHeight}px`,
            }}
            // TailwindCSS 클래스 적용
            className={`
              flex items-center justify-center 
              border border-white 
              transition-all duration-150 ease-in-out
              ${
                isEtc
                  ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  : "bg-blue-100 hover:bg-blue-200 text-blue-800"
              }
              group
            `}
            title={`${item.name}: ${item.originalValue.toFixed(2)} (${(item.value * 100).toFixed(1)}%)`} // 툴팁
          >
            <div className="p-1 text-center overflow-hidden">
              <span className="block text-xs font-medium truncate group-hover:whitespace-normal group-hover:overflow-visible">
                {item.name}
              </span>
              {/* 값 표시 (선택 사항, 공간이 충분할 때만) */}
              {itemWidth > 50 && itemHeight > 20 && !isEtc && (
                <span className="block text-xxs opacity-70 truncate group-hover:whitespace-normal group-hover:overflow-visible">
                  ({(item.value * 100).toFixed(1)}%)
                </span>
              )}
              {itemWidth > 50 && itemHeight > 20 && isEtc && (
                <span className="block text-xxs opacity-70 truncate group-hover:whitespace-normal group-hover:overflow-visible">
                  ({set_d_items_candidates_from_layout.length} items){" "}
                  {/* Use the state/prop here */}
                  {/* "etc"에 포함된 아이템 수 */}
                </span>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}

// TailwindCSS를 위한 text-xxs (매우 작은 텍스트) 정의 (tailwind.config.js 또는 글로벌 CSS에 추가)
// fontSize: {
//   'xxs': '.65rem', // 예시
// }
