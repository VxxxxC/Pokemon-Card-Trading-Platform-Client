import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildBrandedEmailHtml,
  buildBrandedEmailText,
} from "@/lib/email/layout";

const OUTPUT_DIR = join(process.cwd(), "supabase/templates/auth");
const SITE_URL = "{{ .SiteURL }}";
const TOKEN_HASH = "{{ .TokenHash }}";
const LOGO_SRC = `${SITE_URL}/asset/logo.png`;

function buildTokenCallbackHref(type: string, nextPath: string): string {
  return `${SITE_URL}/auth/callback?token_hash=${TOKEN_HASH}&type=${type}&next=${nextPath}`;
}

type TemplateSpec = {
  fileBase: string;
  subject: string;
  layout: Parameters<typeof buildBrandedEmailHtml>[0];
  textLayout: Parameters<typeof buildBrandedEmailText>[0];
};

const TEMPLATES: TemplateSpec[] = [
  {
    fileBase: "confirm-signup",
    subject: "確認你的 Cardvault HK 帳戶",
    layout: {
      title: "確認你的電郵",
      preheader: "請確認電郵以啟用 Cardvault HK 帳戶",
      headline: "歡迎加入 Cardvault HK",
      bodyLines: [
        "感謝註冊！請確認你的電郵地址以啟用帳戶。",
        "確認後即可開始瀏覽、議價與交易 Pokémon TCG 卡牌。",
      ],
      primaryAction: {
        label: "確認電郵",
        href: "#",
        unsafeHref: buildTokenCallbackHref("signup", "/profile/user"),
      },
      unsafeLogoSrc: LOGO_SRC,
      footerLines: [
        "Cardvault HK — Pokémon TCG 專業交易平台",
        "如非本人註冊，請忽略此郵件。",
      ],
    },
    textLayout: {
      title: "確認你的電郵",
      headline: "歡迎加入 Cardvault HK",
      bodyLines: [
        "感謝註冊！請確認你的電郵地址以啟用帳戶。",
        "確認後即可開始瀏覽、議價與交易。",
      ],
      primaryAction: {
        label: "確認電郵",
        href: buildTokenCallbackHref("signup", "/profile/user"),
      },
      footerLines: [
        "Cardvault HK",
        "如非本人註冊，請忽略此郵件。",
      ],
    },
  },
  {
    fileBase: "reset-password",
    subject: "重設你的 Cardvault HK 密碼",
    layout: {
      title: "重設密碼",
      preheader: "你申請了重設 Cardvault HK 密碼",
      headline: "重設密碼",
      bodyLines: [
        "我們收到你申請重設密碼的請求。",
        "請點擊下方按鈕設定新密碼。連結將在短時間後失效。",
      ],
      primaryAction: {
        label: "重設密碼",
        href: "#",
        unsafeHref: buildTokenCallbackHref(
          "recovery",
          "/auth/forgot-password/complete",
        ),
      },
      unsafeLogoSrc: LOGO_SRC,
      footerLines: [
        "Cardvault HK — Pokémon TCG 專業交易平台",
        "如非本人申請，請忽略此郵件並檢查帳戶安全。",
      ],
    },
    textLayout: {
      title: "重設密碼",
      headline: "重設密碼",
      bodyLines: [
        "我們收到你申請重設密碼的請求。",
        "請使用以下連結設定新密碼。連結將在短時間後失效。",
      ],
      primaryAction: {
        label: "重設密碼",
        href: buildTokenCallbackHref(
          "recovery",
          "/auth/forgot-password/complete",
        ),
      },
      footerLines: [
        "Cardvault HK",
        "如非本人申請，請忽略此郵件。",
      ],
    },
  },
  {
    fileBase: "magic-link",
    subject: "登入 Cardvault HK",
    layout: {
      title: "登入連結",
      preheader: "你的 Cardvault HK 一次性登入連結",
      headline: "登入 Cardvault HK",
      bodyLines: [
        "請點擊下方按鈕登入帳戶。",
        "此連結僅可使用一次，並將在短時間後失效。",
      ],
      primaryAction: {
        label: "登入",
        href: "#",
        unsafeHref: buildTokenCallbackHref("magiclink", "/profile/user"),
      },
      unsafeLogoSrc: LOGO_SRC,
    },
    textLayout: {
      title: "登入連結",
      headline: "登入 Cardvault HK",
      bodyLines: [
        "請使用以下連結登入帳戶。",
        "此連結僅可使用一次。",
      ],
      primaryAction: {
        label: "登入",
        href: buildTokenCallbackHref("magiclink", "/profile/user"),
      },
    },
  },
  {
    fileBase: "change-email",
    subject: "確認你的新電郵地址",
    layout: {
      title: "確認新電郵",
      preheader: "請確認你的 Cardvault HK 新電郵地址",
      headline: "確認新電郵地址",
      bodyLines: [
        "你正在更改 Cardvault HK 帳戶的登入電郵。",
        "請點擊下方按鈕確認新電郵地址。",
      ],
      primaryAction: {
        label: "確認新電郵",
        href: "#",
        unsafeHref: buildTokenCallbackHref("email_change", "/profile/user/settings"),
      },
      unsafeLogoSrc: LOGO_SRC,
    },
    textLayout: {
      title: "確認新電郵",
      headline: "確認新電郵地址",
      bodyLines: [
        "你正在更改帳戶登入電郵。",
        "請使用以下連結確認新電郵地址。",
      ],
      primaryAction: {
        label: "確認新電郵",
        href: buildTokenCallbackHref("email_change", "/profile/user/settings"),
      },
    },
  },
];

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const template of TEMPLATES) {
  writeFileSync(
    join(OUTPUT_DIR, `${template.fileBase}.subject.txt`),
    template.subject,
    "utf8",
  );
  writeFileSync(
    join(OUTPUT_DIR, `${template.fileBase}.html`),
    buildBrandedEmailHtml(template.layout),
    "utf8",
  );
  writeFileSync(
    join(OUTPUT_DIR, `${template.fileBase}.txt`),
    buildBrandedEmailText(template.textLayout),
    "utf8",
  );
}

console.log(`Generated ${TEMPLATES.length} Supabase auth email templates in ${OUTPUT_DIR}`);
