export interface UserReviewItem {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
  isMerchantTx?: boolean;
  reviewerId?: string;
  avatarSeed?: string;
}

export const MOCK_MEMBER_REVIEWS: UserReviewItem[] = [
  { id: "rev-001", reviewer: "K.田中", rating: 5, comment: "包裝非常謹慎，卡況與描述完全一致，快速發貨，強力推薦！", date: "2026年 5月", isMerchantTx: false, reviewerId: "koji_tcg", avatarSeed: "user-yamada-ren-tcg" },
  { id: "rev-002", reviewer: "C.Lin", rating: 5, comment: "專業賣家，溝通回應快，第二次購買同一位賣家，值得信賴。", date: "2026年 4月", isMerchantTx: false, reviewerId: "HKCV-USER-001", avatarSeed: "cwb-collector-hk" },
  { id: "rev-003", reviewer: "M.鈴木", rating: 5, comment: "PSA 10 品相完美，雙重氣泡袋保護出貨，超出預期，感謝！", date: "2026年 3月", isMerchantTx: true, reviewerId: "yuenlong-mrlee", avatarSeed: "yuenlong-mrlee" },
  { id: "rev-004", reviewer: "Y.Watanabe", rating: 4.5, comment: "卡況與圖片描述一致，發貨稍慢但最終無恙送達，整體滿意。", date: "2026年 2月", isMerchantTx: false, reviewerId: "watanabe-gym-tcg", avatarSeed: "watanabe-gym-tcg" },
  { id: "rev-005", reviewer: "T.佐藤", rating: 5, comment: "驗證賣家，每次購買都很放心，Charizard ex SAR 品相無可挑剔。", date: "2026年 1月", isMerchantTx: true, reviewerId: "yuenlong-mrlee", avatarSeed: "yuenlong-mrlee" },
  { id: "rev-006", reviewer: "R.Nakamura", rating: 5, comment: "回覆訊息迅速，協助確認卡號與版次，服務態度非常好。", date: "2025年 12月", isMerchantTx: false, reviewerId: "laichikok-master", avatarSeed: "laichikok-master" },
  { id: "rev-007", reviewer: "H.伊藤", rating: 4.5, comment: "交易過程順暢，描述準確，唯發貨通知稍晚，但快遞速度快。", date: "2025年 11月", isMerchantTx: false, reviewerId: "sai-ying-pun-power", avatarSeed: "sai-ying-pun-power" },
  { id: "rev-008", reviewer: "S.Chen", rating: 5, comment: "Umbreon ex SAR 品相完美，硬殼盒加外層防水袋，滿分包裝！", date: "2025年 10月", isMerchantTx: true, reviewerId: "cwb-collector-hk", avatarSeed: "cwb-collector-hk" },
  { id: "rev-009", reviewer: "A.Kimura", rating: 5, comment: "高評分賣家實至名歸，BGS 9.5 品相分毫不差，絕對再回購。", date: "2025年 9月", isMerchantTx: false, reviewerId: "tsimshatsui-card-god", avatarSeed: "tsimshatsui-card-god" },
  { id: "rev-010", reviewer: "D.山本", rating: 4.5, comment: "交易完成，溝通愉快，對方非常有耐心解答問題，讚！", date: "2025年 8月", isMerchantTx: false, reviewerId: "sai-ying-pun-power", avatarSeed: "sai-ying-pun-power" },
  { id: "rev-011", reviewer: "N.Tanaka", rating: 5, comment: "稀有卡品相維護得相當好，附來源收據，非常專業。", date: "2025年 7月", isMerchantTx: true, reviewerId: "koji_tcg", avatarSeed: "user-yamada-ren-tcg" },
  { id: "rev-012", reviewer: "E.小林", rating: 5, comment: "Pikachu AR 光澤完好，無壓痕無刮痕，包裝超級用心，感動！", date: "2025年 6月", isMerchantTx: false, reviewerId: "shekkei-secondhand", avatarSeed: "shekkei-secondhand" },
  { id: "rev-013", reviewer: "W.Sato", rating: 5, comment: "快速回應、誠實描述瑕疵點，非常誠信的賣家，推薦給所有卡友。", date: "2025年 5月", isMerchantTx: true, reviewerId: "osaka-mystery-room", avatarSeed: "osaka-mystery-room" },
  { id: "rev-014", reviewer: "P.Ito", rating: 4.5, comment: "交易第三次了，每次體驗都很好，只要品相符合就絕對推薦。", date: "2025年 4月", isMerchantTx: false },
  { id: "rev-015", reviewer: "B.Suzuki", rating: 5, comment: "PSA 鑑定卡裝在官方展示架內寄出，防護到位，非常感激。", date: "2025年 3月", isMerchantTx: true },
  { id: "rev-016", reviewer: "F.Kobayashi", rating: 5, comment: "卡況如圖，閃卡光澤完美保留，打包方式專業，下次再來。", date: "2025年 2月", isMerchantTx: false },
  { id: "rev-017", reviewer: "G.Yamamoto", rating: 4.5, comment: "小型交易，過程簡單順暢，賣家應對輕鬆友善，很加分。", date: "2025年 1月", isMerchantTx: false },
  { id: "rev-018", reviewer: "L.Hayashi", rating: 5, comment: "Mimikyu ex SAR 包裝完善，氣泡袋雙層，超越期待！", date: "2024年 12月", isMerchantTx: true },
  { id: "rev-019", reviewer: "O.Matsumoto", rating: 5, comment: "賣家態度誠懇，提前告知品相細節，信任度超高，五星好評。", date: "2024年 11月", isMerchantTx: false },
  { id: "rev-020", reviewer: "Q.Inoue", rating: 5, comment: "第一次在此平台購買，非常順利，嚴謹賣家，絕對再回購。", date: "2024年 10月", isMerchantTx: false },
  { id: "rev-021", reviewer: "V.Kimura", rating: 4.5, comment: "卡況準確，回應時效良好，物流速度快，整體滿意。", date: "2024年 9月", isMerchantTx: true },
  { id: "rev-022", reviewer: "Z.Fujita", rating: 5, comment: "CGC 9 品相與封裝，賣家附詳細開盒說明，超貼心服務。", date: "2024年 8月", isMerchantTx: true },
];
