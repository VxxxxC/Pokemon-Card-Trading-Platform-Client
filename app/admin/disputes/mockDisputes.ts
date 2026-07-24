export type DisputeStatus = "pending" | "completed";

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
  completed: "已完成",
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

// TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
// Target Table: user_reports, orders, chat_messages | View / RPC: list_dispute_cases
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
    status: "pending",
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
    status: "completed",
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
    status: "completed",
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
    status: "completed",
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
    status: "pending",
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
    status: "completed",
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
  {
    id: "DSP-2025-293",
    category: "卡牌品相不符",
    severity: "medium",
    reporter: "C.Wong",
    accused: { name: "Kyoto Vault", handle: "@kyoto_vault" },
    cardName: "Gengar VMAX AA (PSA 10)",
    escrowAmount: 18500,
    orderId: "ORD-2025-98012",
    stripeChargeId: "ch_9QuZ58R88rVy0F5h9iJ0kL1m",
    submittedAt: "2025-05-12 15:20",
    description: "買家收到商品後指出 PSA 壓合框邊角有些許凹痕，質疑非原裝卡盒。",
    status: "pending",
    escrowStep: "custody",
    chatHistory: [],
    evidence: { photos: ["PSA 盒角凹痕截圖"] },
    auditLog: [{ action: "案件建立", reason: "買家申訴品相不符", timestamp: "2025-05-12 15:20" }],
  },
  {
    id: "DSP-2025-292",
    category: "誘導私下交易",
    severity: "critical",
    reporter: "S.Takahashi",
    accused: { name: "FlashTCG HK", handle: "@flashtcg_hk" },
    cardName: "Lillie SR (BGS 9.5)",
    escrowAmount: 64000,
    orderId: "ORD-2025-97980",
    stripeChargeId: "ch_0RvA69S99sWz1G6i0jK1lM2n",
    submittedAt: "2025-05-11 19:10",
    description: "賣家多次發送外部通訊軟體賬號要求轉帳打折交易，風控自動凍結資金。",
    status: "pending",
    escrowStep: "payment",
    chatHistory: [],
    evidence: { photos: ["風控對話高亮報告"] },
    auditLog: [{ action: "風控自動建單", reason: "外部私下交易誘導", timestamp: "2025-05-11 19:10" }],
  },
  {
    id: "DSP-2025-291",
    category: "物流爭議",
    severity: "medium",
    reporter: "E.Tsang",
    accused: { name: "Osaka Collector", handle: "@osaka_col" },
    cardName: "Sylveon ex SAR",
    escrowAmount: 12000,
    orderId: "ORD-2025-97811",
    stripeChargeId: "ch_1SwB70T00tXa2H7j1kL2mM3o",
    submittedAt: "2025-05-10 11:05",
    description: "包裹快遞運送遺失，物流承運商已出具丟失證明，申請平台託管金退還買家。",
    status: "completed",
    escrowStep: "shipped",
    chatHistory: [],
    evidence: { photos: ["物流官方丟失證明文件"] },
    auditLog: [{ action: "裁定買家勝訴", reason: "物流遺失全額退款", timestamp: "2025-05-10 14:00" }],
  },
  {
    id: "DSP-2025-290",
    category: "惡意欺詐",
    severity: "critical",
    reporter: "W.Ho",
    accused: { name: "FakeBreaker", handle: "@fakebreaker" },
    cardName: "Mario Pikachu Promo (PSA 10)",
    escrowAmount: 150000,
    orderId: "ORD-2025-97722",
    stripeChargeId: "ch_2TxC81U11uYb3I8k2lL3nM4p",
    submittedAt: "2025-05-09 18:30",
    description: "涉及高額假卡重組盒詐騙案，法務與警方已介入，賬戶全面凍結中。",
    status: "completed",
    escrowStep: "custody",
    chatHistory: [],
    evidence: { photos: ["警方調查通知書"] },
    auditLog: [{ action: "強制凍結", reason: "高額詐騙案立案調查", timestamp: "2025-05-09 18:30" }],
  },
  {
    id: "DSP-2025-289",
    category: "卡牌品相不符",
    severity: "medium",
    reporter: "D.Chau",
    accused: { name: "Shinobi Cards", handle: "@shinobi_cards" },
    cardName: "Giratina VSTAR AA (BGS 10)",
    escrowAmount: 29000,
    orderId: "ORD-2025-97640",
    stripeChargeId: "ch_3UyD92V22vZc4J9l3mM4nO5q",
    submittedAt: "2025-05-08 14:00",
    description: "買家聲稱背面色差嚴重，但對比 BGS 官方數據庫後確認為正常印刷差異，裁定放款。",
    status: "completed",
    escrowStep: "released",
    chatHistory: [],
    evidence: { photos: ["BGS 官方紀錄備份"] },
    auditLog: [{ action: "裁定賣家勝訴", reason: "符合 BGS 官方評級規範", timestamp: "2025-05-09 10:00" }],
  },
  {
    id: "DSP-2025-288",
    category: "物流爭議",
    severity: "medium",
    reporter: "K.Inoue",
    accused: { name: "Tokyo Card Base", handle: "@tokyo_base" },
    cardName: "Gardevoir ex SAR",
    escrowAmount: 8800,
    orderId: "ORD-2025-97501",
    stripeChargeId: "ch_4VzE03W33waD5K0m4nO5pP6r",
    submittedAt: "2025-05-07 09:15",
    description: "順豐包裹遭海關抽查滯留，買家請求協助催促報關進度。",
    status: "pending",
    escrowStep: "shipped",
    chatHistory: [],
    evidence: { photos: ["海關扣留通知截圖"] },
    auditLog: [{ action: "案件建立", reason: "買家請求物流協助", timestamp: "2025-05-07 09:15" }],
  },
  {
    id: "DSP-2025-287",
    category: "誘導私下交易",
    severity: "critical",
    reporter: "R.Cheung",
    accused: { name: "CardHub Macau", handle: "@cardhub_macau" },
    cardName: "Alakazam ex SAR (PSA 10)",
    escrowAmount: 42000,
    orderId: "ORD-2025-97433",
    stripeChargeId: "ch_5WaF14X44xbE6L1n5oP6qQ7s",
    submittedAt: "2025-05-06 20:45",
    description: "買家舉報賣家附帶名片並標註「私下轉帳免 5% 佣金」，平台調查中。",
    status: "pending",
    escrowStep: "payment",
    chatHistory: [],
    evidence: { photos: ["名片拍攝照片", "私訊對話截圖"] },
    auditLog: [{ action: "案件建立", reason: "誘導私下交易舉報", timestamp: "2025-05-06 20:45" }],
  },
  {
    id: "DSP-2025-286",
    category: "惡意欺詐",
    severity: "critical",
    reporter: "T.Mori",
    accused: { name: "FastSell TCG", handle: "@fastsell_tcg" },
    cardName: "Snorlax Promo (PSA 9)",
    escrowAmount: 95000,
    orderId: "ORD-2025-97320",
    stripeChargeId: "ch_6XbG25Y55ycF7M2o6pQ7rR8t",
    submittedAt: "2025-05-05 13:10",
    description: "賣家空包發貨，拆箱影片證明箱內僅有報紙與石頭，已判定全額退款並封禁賣家。",
    status: "completed",
    escrowStep: "custody",
    chatHistory: [],
    evidence: { photos: ["空包拆箱全程影片"] },
    auditLog: [{ action: "裁定買家勝訴", reason: "惡意空包欺詐，款項退回買家", timestamp: "2025-05-05 16:30" }],
  },
  {
    id: "DSP-2025-285",
    category: "卡牌品相不符",
    severity: "medium",
    reporter: "N.Kwan",
    accused: { name: "Fukuoka TCG Lab", handle: "@fukuoka_tcg" },
    cardName: "Blastoise ex SAR",
    escrowAmount: 33000,
    orderId: "ORD-2025-97215",
    stripeChargeId: "ch_7YcH36Z66zdG8N3p7qR8sS9u",
    submittedAt: "2025-05-04 16:50",
    description: "買家指出卡牌卡面有壓紋瑕疵，請求賣家進行折價補助。",
    status: "pending",
    escrowStep: "custody",
    chatHistory: [],
    evidence: { photos: ["卡面微距照"] },
    auditLog: [{ action: "案件建立", reason: "品相爭議待協商", timestamp: "2025-05-04 16:50" }],
  },
  {
    id: "DSP-2025-284",
    category: "物流爭議",
    severity: "medium",
    reporter: "L.Chan",
    accused: { name: "Sapporo Cards", handle: "@sapporo_cards" },
    cardName: "Venusaur ex SAR",
    escrowAmount: 21000,
    orderId: "ORD-2025-97109",
    stripeChargeId: "ch_8ZdI47A77aeH9O4q8rS9tT0v",
    submittedAt: "2025-05-03 10:25",
    description: "快遞外箱嚴重擠壓變形，內部卡盒是否有受損尚在鑑定中。",
    status: "completed",
    escrowStep: "shipped",
    chatHistory: [],
    evidence: { photos: ["變形外箱照片"] },
    auditLog: [{ action: "調查中", reason: "等待快遞賠償鑑定報告", timestamp: "2025-05-03 11:00" }],
  },
  {
    id: "DSP-2025-283",
    category: "誘導私下交易",
    severity: "medium",
    reporter: "M.Fung",
    accused: { name: "Kobe Collectibles", handle: "@kobe_col" },
    cardName: "Suicune V AA (PSA 10)",
    escrowAmount: 16000,
    orderId: "ORD-2025-97002",
    stripeChargeId: "ch_9AeJ58B88bfI0P5r9sT0uU1w",
    submittedAt: "2025-05-02 22:15",
    description: "對話觸發警示後，賣家解釋僅為解答見面交收疑問，無私下轉帳行為，審核後放款。",
    status: "completed",
    escrowStep: "released",
    chatHistory: [],
    evidence: { photos: ["完整聊天對話紀錄"] },
    auditLog: [{ action: "裁定賣家勝訴", reason: "無實質違規私下交易", timestamp: "2025-05-03 09:00" }],
  },
  {
    id: "DSP-2025-282",
    category: "卡牌品相不符",
    severity: "medium",
    reporter: "J.Wong",
    accused: { name: "Yokohama TCG", handle: "@yokohama_tcg" },
    cardName: "Rayquaza Gold Star (BGS 8.5)",
    escrowAmount: 58000,
    orderId: "ORD-2025-96890",
    stripeChargeId: "ch_0BfK69C99cgJ1Q6s0tU1vV2x",
    submittedAt: "2025-05-01 12:40",
    description: "古董卡品相爭議，賣家漏標邊角重磨（re-colored），驗證後買家勝訴。",
    status: "completed",
    escrowStep: "custody",
    chatHistory: [],
    evidence: { photos: ["紫外線螢光檢驗圖"] },
    auditLog: [{ action: "裁定買家勝訴", reason: "未揭露邊角修補問題", timestamp: "2025-05-02 11:30" }],
  },
  {
    id: "DSP-2025-281",
    category: "惡意欺詐",
    severity: "critical",
    reporter: "P.Leung",
    accused: { name: "QuickCash Vault", handle: "@quickcash_v" },
    cardName: "Latios & Latias GX (PSA 10)",
    escrowAmount: 110000,
    orderId: "ORD-2025-96777",
    stripeChargeId: "ch_1CgL70D00dhK2R7t1uV2wW3y",
    submittedAt: "2025-04-30 17:00",
    description: "買家舉報賣家嘗試複製 PSA 證號標籤，正由防偽技術組進行比對。",
    status: "pending",
    escrowStep: "custody",
    chatHistory: [],
    evidence: { photos: ["高清標籤條碼放大圖"] },
    auditLog: [{ action: "案件建立", reason: "涉嫌標籤偽造舉報", timestamp: "2025-04-30 17:00" }],
  },
  {
    id: "DSP-2025-280",
    category: "物流爭議",
    severity: "medium",
    reporter: "V.Pang",
    accused: { name: "Sendai Cards", handle: "@sendai_cards" },
    cardName: "Mewtwo Gold Star",
    escrowAmount: 14500,
    orderId: "ORD-2025-96654",
    stripeChargeId: "ch_2DhM81E11eiL3S8u2vW3xX4z",
    submittedAt: "2025-04-29 08:30",
    description: "順豐保價快遞索賠程序進行中，買賣雙方已達成暫緩放款共識。",
    status: "completed",
    escrowStep: "shipped",
    chatHistory: [],
    evidence: { photos: ["順豐理賠申請單"] },
    auditLog: [{ action: "調查中", reason: "進行快遞保價理賠流程", timestamp: "2025-04-29 09:00" }],
  },
];

export function getDisputeById(id: string): DisputeCase | undefined {
  return mockDisputes.find((d) => d.id === id);
}
