export type DisputeStatus =
  | "pending"
  | "investigating"
  | "buyer_refunded"
  | "seller_released"
  | "frozen";

export type DisputeCategory =
  | "惡意欺詐"
  | "卡牌品相不符"
  | "誘導私下交易"
  | "物流爭議";

export type DisputeSeverity = "critical" | "medium";

export type EscrowStep =
  | "payment"
  | "custody"
  | "grading"
  | "shipped"
  | "released";

export type ChatSender = "buyer" | "seller" | "system";

export interface DisputeChatMessage {
  sender: ChatSender;
  name: string;
  message: string;
  timestamp: string;
}

export interface DisputeEvidence {
  photos: string[];
  videoUrl?: string;
}

export interface DisputeAuditEntry {
  action: string;
  reason: string;
  timestamp: string;
}

export interface DisputeAccused {
  name: string;
  handle: string;
}

export interface DisputeCase {
  id: string;
  category: DisputeCategory;
  severity: DisputeSeverity;
  reporter: string;
  accused: DisputeAccused;
  cardName: string;
  escrowAmount: number;
  orderId: string;
  stripeChargeId: string;
  submittedAt: string;
  description: string;
  status: DisputeStatus;
  escrowStep: EscrowStep;
  chatHistory: DisputeChatMessage[];
  evidence: DisputeEvidence;
  auditLog: DisputeAuditEntry[];
}

export const statusLabelMap: Record<DisputeStatus, string> = {
  pending: "待處理",
  investigating: "調查中",
  buyer_refunded: "買家勝訴",
  seller_released: "賣家勝訴",
  frozen: "已凍結",
};

export const categoryLabelMap: Record<DisputeCategory, string> = {
  惡意欺詐: "惡意欺詐",
  卡牌品相不符: "卡牌品相不符",
  誘導私下交易: "誘導私下交易",
  物流爭議: "物流爭議",
};

const evidencePhotos = [
  "開箱影片截圖（背面右上角白邊刮痕）",
  "賣家出貨前高畫質錄像（封裝完整）",
  "順豐簽收單與外箱照片",
  "PSA 認證標籤特寫",
];

export const mockDisputes: DisputeCase[] = [
  {
    id: "DSP-2025-302",
    category: "卡牌品相不符",
    severity: "critical",
    reporter: "M.佐藤",
    accused: { name: "KojiTCG Premium", handle: "@kojitcg_premium" },
    cardName: "Charizard ex SAR (PSA 10)",
    escrowAmount: 49800,
    orderId: "ORD-2025-99214",
    stripeChargeId: "ch_3NfG82H92fKy8X0a1bC2dE3f",
    submittedAt: "2025-05-21 11:24",
    description:
      "買家聲稱卡牌背面右上角有明顯白邊刮痕，不符合 PSA 10 的封裝標準，質疑存在掉包或二次封裝嫌疑。賣家聲稱發貨前有拍照存檔，卡盒完好無損。",
    status: "pending",
    escrowStep: "custody",
    chatHistory: [
      {
        sender: "system",
        name: "系統 Escrow 通知",
        message: "訂單已成交。買家已付款，資金已由 Stripe 託管中。",
        timestamp: "2025-05-19 14:02",
      },
      {
        sender: "buyer",
        name: "M.佐藤",
        message:
          "收到貨了，但這張卡背面右上角明顯有刮白邊！PSA 10 怎麼可能有這種瑕疵？我強烈要求退款！",
        timestamp: "2025-05-20 18:15",
      },
      {
        sender: "seller",
        name: "KojiTCG Premium",
        message:
          "你好，我們在出貨時進行了高畫質攝像，外殼及金卡均無任何損壞。請確認是否是您簽收時損壞，或者快遞運輸問題？",
        timestamp: "2025-05-21 09:30",
      },
      {
        sender: "buyer",
        name: "M.佐藤",
        message:
          "包裹外包裝完好無損，拆箱時卡盒就是這樣了！我已經上傳拆箱錄像，請平台介入仲裁！",
        timestamp: "2025-05-21 10:12",
      },
      {
        sender: "system",
        name: "系統 Escrow 通知",
        message: "買家已提交申訴，並進入平台人工仲裁介入階段。目前資金已鎖定。",
        timestamp: "2025-05-21 11:24",
      },
    ],
    evidence: {
      photos: evidencePhotos.slice(0, 4),
      videoUrl: "https://vault.cdn.example/disputes/dsp302_unboxing.mp4",
    },
    auditLog: [
      {
        action: "案件建立",
        reason: "買家於 UI 提交爭議申訴",
        timestamp: "2025-05-21 11:24",
      },
    ],
  },
  {
    id: "DSP-2025-301",
    category: "誘導私下交易",
    severity: "medium",
    reporter: "TokyoRareCards",
    accused: { name: "C.Chen", handle: "@cchen_tcg" },
    cardName: "Umbreon ex SAR (BGS 9)",
    escrowAmount: 38200,
    orderId: "ORD-2025-99105",
    stripeChargeId: "ch_2MeF83J29sL4Y9b2cD3eF4g",
    submittedAt: "2025-05-20 09:12",
    description:
      "買家在聊天中要求繞過平台以 PayMe 付款，並提議先轉部分訂金至 9123 4567，賣家拒絕後舉報。平台風控檢測到關鍵字觸發此爭議單。",
    status: "investigating",
    escrowStep: "payment",
    chatHistory: [
      {
        sender: "system",
        name: "系統 Escrow 通知",
        message: "競拍結束，買家 @cchen_tcg 得標，出價 HK$ 38,200。",
        timestamp: "2025-05-18 09:00",
      },
      {
        sender: "seller",
        name: "TokyoRareCards",
        message:
          "您好，恭喜得標！請在 48 小時內完成付款，我們將立即安排空運快遞。",
        timestamp: "2025-05-18 10:30",
      },
      {
        sender: "buyer",
        name: "C.Chen",
        message:
          "可以唔可以轉 PayMe？我俾 cash 都得，我有個師兄可以上門收。我的 WhatsApp https://wa.me/85291234567",
        timestamp: "2025-05-18 11:05",
      },
      {
        sender: "seller",
        name: "TokyoRareCards",
        message: "不好意思，我們只接受平台託管付款，無法私下交易。",
        timestamp: "2025-05-18 11:30",
      },
      {
        sender: "buyer",
        name: "C.Chen",
        message: "俾個 FPS 轉數快號碼我都得，我依家過數，你留卡俾我。",
        timestamp: "2025-05-18 12:00",
      },
      {
        sender: "system",
        name: "系統 Escrow 通知",
        message: "風控偵測到買家多次要求線下付款，已自動建立爭議调查單。",
        timestamp: "2025-05-20 09:12",
      },
    ],
    evidence: {
      photos: [
        "聊天截圖（PayMe / FPS 關鍵字高亮）",
        "風控自動標記報告",
        "賣家舉報附件",
      ],
    },
    auditLog: [
      {
        action: "風控自動建單",
        reason: "聊天內含 PayMe、FPS、轉數快及外部連結",
        timestamp: "2025-05-20 09:12",
      },
      {
        action: "開始調查",
        reason: "管理員接手並限制買家下單",
        timestamp: "2025-05-20 10:05",
      },
    ],
  },
  {
    id: "DSP-2025-299",
    category: "物流爭議",
    severity: "medium",
    reporter: "A.Yamamoto",
    accused: { name: "NagoyaTCG", handle: "@nagoyatcg" },
    cardName: "Espeon ex SAR",
    escrowAmount: 31200,
    orderId: "ORD-2025-98842",
    stripeChargeId: "ch_1KyT92K11fPs2Z8a3bC4dE5f",
    submittedAt: "2025-05-18 16:40",
    description:
      "快遞狀態顯示已簽收，但買家表示未收到包裹。經與順豐核對，簽收地址與買家地址不符。",
    status: "buyer_refunded",
    escrowStep: "shipped",
    chatHistory: [
      {
        sender: "buyer",
        name: "A.Yamamoto",
        message:
          "物流顯示已簽收，可是我根本沒收到，我的信箱也沒東西。是不是寄錯地址了？",
        timestamp: "2025-05-18 14:20",
      },
      {
        sender: "seller",
        name: "NagoyaTCG",
        message: "我們是按照平台提供的地址填寫的單號，快遞單照片已發在申訴中。",
        timestamp: "2025-05-18 15:00",
      },
      {
        sender: "system",
        name: "系統 Escrow 通知",
        message: "平台已完成順豐簽收地址核對，確認與買家預留地址不符。",
        timestamp: "2025-05-18 16:40",
      },
    ],
    evidence: {
      photos: [
        "順豐電子簽收單（地址欄截圖）",
        "買家平台預設地址對照",
        "包裹外箱照片",
      ],
    },
    auditLog: [
      {
        action: "案件建立",
        reason: "買家申訴未收到包裹",
        timestamp: "2025-05-18 16:40",
      },
      {
        action: "裁定買家勝訴",
        reason: "快遞地址與預留地址不符，責任在物流公司及賣家出單環節",
        timestamp: "2025-05-19 09:30",
      },
    ],
  },
  {
    id: "DSP-2025-298",
    category: "惡意欺詐",
    severity: "critical",
    reporter: "H.Kwok",
    accused: { name: "PikaVault HK", handle: "@pikavault_hk" },
    cardName: "Pikachu SAR (PSA 10)",
    escrowAmount: 125000,
    orderId: "ORD-2025-98710",
    stripeChargeId: "ch_4LpU03L33mQt5A0c4dE5fG6h",
    submittedAt: "2025-05-17 20:15",
    description:
      "賣家使用經過修圖的卡牌照片誤導買家，實物為 counterfeit（ counterfeit 封裝盒）。買家提交第三方 PSA Expert 檢驗報告佐證。",
    status: "frozen",
    escrowStep: "custody",
    chatHistory: [
      {
        sender: "buyer",
        name: "H.Kwok",
        message:
          "呢張 PSA 10 皮卡丘係假盒，我搵人驗過，個 label 顏色同字體都唔啱！我要去警署報案。",
        timestamp: "2025-05-17 19:50",
      },
      {
        sender: "seller",
        name: "PikaVault HK",
        message: "我哋啲貨全部正版，你驗錯咗啦，如果你有問題可以退貨。",
        timestamp: "2025-05-17 20:00",
      },
      {
        sender: "buyer",
        name: "H.Kwok",
        message:
          "我已經報警，警方叫我唔好同你私下聯絡。案件編號我會 upload 上嚟。",
        timestamp: "2025-05-17 20:10",
      },
      {
        sender: "system",
        name: "系統 Escrow 通知",
        message:
          "平台已收到 PSA Expert 報告及警方備案通知，資金已轉為凍結狀態。",
        timestamp: "2025-05-17 20:15",
      },
    ],
    evidence: {
      photos: [
        "PSA Expert  counterfeit 檢驗報告",
        "買家報案紙（編號已塗黑）",
        "真假盒對比圖",
        "賣家商品頁截圖",
      ],
      videoUrl: "https://vault.cdn.example/disputes/dsp298_expert_review.mp4",
    },
    auditLog: [
      {
        action: "案件建立",
        reason: "高風險詐騙舉報",
        timestamp: "2025-05-17 20:15",
      },
      {
        action: "升級凍結",
        reason: "涉及假冒 PSA 盒及警方介入，轉交法務小組",
        timestamp: "2025-05-17 21:00",
      },
    ],
  },
  {
    id: "DSP-2025-297",
    category: "誘導私下交易",
    severity: "medium",
    reporter: "CardHunter JP",
    accused: { name: "TommyLam", handle: "@tommylam_tcg" },
    cardName: "Lugia VSTAR (PSA 9)",
    escrowAmount: 28800,
    orderId: "ORD-2025-98503",
    stripeChargeId: "ch_5MqV14M44nRu6B1d5eF6gH7i",
    submittedAt: "2025-05-16 13:55",
    description:
      "買家取消平台付款後，主動透過站外連結要求交易，並提供 6123 8877 聯絡電話及 WeChat ID。",
    status: "pending",
    escrowStep: "payment",
    chatHistory: [
      {
        sender: "buyer",
        name: "TommyLam",
        message:
          "在平台俾手續費好貴，我哋走 WeChat 啦，加我 wechatid_tommy，或者打 6123 8877 搵我。",
        timestamp: "2025-05-16 13:30",
      },
      {
        sender: "seller",
        name: "CardHunter JP",
        message:
          "根據平台規則，所有交易必須透過 Stripe 託管。我會將此對話轉交平台審查。",
        timestamp: "2025-05-16 13:45",
      },
      {
        sender: "system",
        name: "系統 Escrow 通知",
        message: "賣家提交對話記錄，爭議單已建立。",
        timestamp: "2025-05-16 13:55",
      },
    ],
    evidence: {
      photos: [
        "聊天對話截圖（電話與 WeChat 高亮）",
        "賣家拒絕私下交易聲明",
      ],
    },
    auditLog: [
      {
        action: "案件建立",
        reason: "買家誘導賣家私下交易",
        timestamp: "2025-05-16 13:55",
      },
    ],
  },
  {
    id: "DSP-2025-296",
    category: "卡牌品相不符",
    severity: "medium",
    reporter: "S.Lee",
    accused: { name: "MysticCards", handle: "@mysticcards_hk" },
    cardName: "Mew ex SAR (CGC 9.5)",
    escrowAmount: 45600,
    orderId: "ORD-2025-98412",
    stripeChargeId: "ch_6NrW25N55oSv7C2e6fG7hI8j",
    submittedAt: "2025-05-15 10:08",
    description:
      "賣家描述為「完美無瑕」，實物正面右上角有指紋壓痕。買家認為評級應下調，要求部分退款或退回。",
    status: "seller_released",
    escrowStep: "released",
    chatHistory: [
      {
        sender: "buyer",
        name: "S.Lee",
        message:
          "張卡右上角有個明顯指紋印，你聲稱 perfect 嘅？我要求部份 refund。",
        timestamp: "2025-05-15 09:20",
      },
      {
        sender: "seller",
        name: "MysticCards",
        message:
          "張卡出貨前有 video，個印係你拆盒後自己留低。CGC 9.5 本身就有輕微厂瑕，詳情請見 PSA / CGC 標準。",
        timestamp: "2025-05-15 09:40",
      },
      {
        sender: "buyer",
        name: "S.Lee",
        message: "我已經 upload 拆箱片，你睇下個印幾大個。",
        timestamp: "2025-05-15 09:55",
      },
      {
        sender: "system",
        name: "系統 Escrow 通知",
        message: "仲裁完成：賣家照片佐證充分，款項已釋放。",
        timestamp: "2025-05-15 10:08",
      },
    ],
    evidence: {
      photos: [
        "買家拆箱照片（指紋壓痕特寫）",
        "賣家出貨前 video 截圖",
        "CGC 評級標準說明",
      ],
    },
    auditLog: [
      {
        action: "案件建立",
        reason: "買家申訴品相不符",
        timestamp: "2025-05-15 10:08",
      },
      {
        action: "裁定賣家勝訴",
        reason: "賣家影像佐證完整，無法證明損傷發生於出貨前",
        timestamp: "2025-05-16 14:20",
      },
    ],
  },
  {
    id: "DSP-2025-295",
    category: "物流爭議",
    severity: "critical",
    reporter: "Yuki TCG",
    accused: { name: "OsakaPokeShop", handle: "@osakapokeshop" },
    cardName: "Rayquaza VMAX AA (PSA 10)",
    escrowAmount: 88000,
    orderId: "ORD-2025-98291",
    stripeChargeId: "ch_7OsX36P66pTw8D3f7gH8iJ9k",
    submittedAt: "2025-05-14 17:33",
    description:
      "包裹運輸途中滯留大阪海關超過 21 天，賣家未及時提供報關文件，買家要求退款並由賣家承擔關稅損失。",
    status: "investigating",
    escrowStep: "shipped",
    chatHistory: [
      {
        sender: "buyer",
        name: "Yuki TCG",
        message:
          "個 package 卡咗大阪海關三個星期，你仲未 upload 報關文件？我唔要等啦，refund。",
        timestamp: "2025-05-14 16:50",
      },
      {
        sender: "seller",
        name: "OsakaPokeShop",
        message:
          "海關查驗中，呢個唔係我哋控制範圍。你再等多幾日，或者我補你部分運費。",
        timestamp: "2025-05-14 17:05",
      },
      {
        sender: "buyer",
        name: "Yuki TCG",
        message:
          "我買咗保險嘅，依家超過 21 日，根據平台條款我可以全額退款。",
        timestamp: "2025-05-14 17:20",
      },
      {
        sender: "system",
        name: "系統 Escrow 通知",
        message: "爭議進入調查階段，賣家被要求於 48 小時內補交報關文件。",
        timestamp: "2025-05-14 17:33",
      },
    ],
    evidence: {
      photos: [
        "DHL 追蹤頁面截圖（滯留狀態）",
        "平台運輸保險條款截圖",
        "買方付款憑證",
      ],
    },
    auditLog: [
      {
        action: "案件建立",
        reason: "買家因海關滯留申請退款",
        timestamp: "2025-05-14 17:33",
      },
      {
        action: "要求賣家補件",
        reason: "需核實大阪海關報關狀態",
        timestamp: "2025-05-14 18:00",
      },
    ],
  },
  {
    id: "DSP-2025-294",
    category: "惡意欺詐",
    severity: "critical",
    reporter: "K.Tam",
    accused: { name: "RareFind JP", handle: "@rarefind_jp" },
    cardName: "Charizard VSTAR SA (PSA 10)",
    escrowAmount: 72000,
    orderId: "ORD-2025-98150",
    stripeChargeId: "ch_8PtY47Q77qUx9E4g8hI9jK0l",
    submittedAt: "2025-05-13 08:45",
    description:
      "賣家帳號註冊後 24 小時內上架高價卡並完成收款，隨後失聯。該帳號經排查與先前被封禁帳號存在 IP 關聯。",
    status: "buyer_refunded",
    escrowStep: "released",
    chatHistory: [
      {
        sender: "system",
        name: "系統 Escrow 通知",
        message: "訂單已完成並自動放款至賣家。",
        timestamp: "2025-05-12 18:00",
      },
      {
        sender: "buyer",
        name: "K.Tam",
        message:
          "賣家由尋日開始已讀唔覆，我完全收唔到貨。佢個帳號係咪新開？",
        timestamp: "2025-05-13 08:10",
      },
      {
        sender: "system",
        name: "系統 Escrow 通知",
        message: "風控發現該帳號與近期被封禁帳號存在 IP 關聯。",
        timestamp: "2025-05-13 08:30",
      },
      {
        sender: "buyer",
        name: "K.Tam",
        message: "我俾人呃咗！求求你先 refund 返我。",
        timestamp: "2025-05-13 08:40",
      },
      {
        sender: "system",
        name: "系統 Escrow 通知",
        message: "平台已確認詐騙跡象，正在透過 Stripe 發起全額退款。",
        timestamp: "2025-05-13 08:45",
      },
    ],
    evidence: {
      photos: [
        "賣家帳號註冊時間截圖",
        "IP 關聯風控報告",
        "買家付款與未發貨記錄",
      ],
    },
    auditLog: [
      {
        action: "案件建立",
        reason: "高價卡新帳號詐騙舉報",
        timestamp: "2025-05-13 08:45",
      },
      {
        action: "裁定買家勝訴",
        reason: "確認帳號詐騙，由 Stripe 發起 chargeback 退款",
        timestamp: "2025-05-13 10:10",
      },
      {
        action: "標記封禁",
        reason: "帳號與已知欺詐 IP 關聯",
        timestamp: "2025-05-13 10:15",
      },
    ],
  },
];

export function getDisputeById(id: string): DisputeCase | undefined {
  return mockDisputes.find((d) => d.id === id);
}
