import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendConfirmation(booking: {
  email: string;
  name: string;
  storeName: string;
  courseName: string;
  price: number;
  bookedAt: string;
}) {
  const date = new Date(booking.bookedAt);
  const formatted = date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  await getResend().emails.send({
    from: "C5med Beauty <noreply@c5med.jp>",
    to: booking.email,
    subject: `【C5med Beauty】ご予約確認 - ${booking.storeName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">ご予約ありがとうございます</h2>
        <p>${booking.name} 様</p>
        <p>以下の内容でご予約を承りました。</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; color: #666;">店舗</td>
            <td style="padding: 8px; font-weight: bold;">${booking.storeName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; color: #666;">コース</td>
            <td style="padding: 8px; font-weight: bold;">${booking.courseName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; color: #666;">日時</td>
            <td style="padding: 8px; font-weight: bold;">${formatted}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; color: #666;">料金</td>
            <td style="padding: 8px; font-weight: bold;">¥${booking.price.toLocaleString()}（税込）</td>
          </tr>
        </table>
        <p style="color: #666; font-size: 14px;">
          キャンセル・変更をご希望の場合は、店舗へ直接ご連絡ください。
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">C5med Beauty</p>
      </div>
    `,
  });
}
