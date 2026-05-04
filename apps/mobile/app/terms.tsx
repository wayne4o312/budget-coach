import { Text } from "@/components/ui/text";
import {
  LegalDocumentScreen,
  LegalSection,
  legalStyles,
} from "@/src/components/legal/LegalDocumentScreen";

const UPDATED = "2026年5月3日";

export default function TermsScreen() {
  return (
    <LegalDocumentScreen stackTitle="服务条款" lastUpdated={UPDATED}>
      <Text style={legalStyles.paragraph}>
        欢迎使用本应用（下称「服务」）。以下条款构成您与运营方之间关于使用服务的协议摘要模板。在正式发布或面向公众推广前，应由法务或合规人员审阅并替换为最终文本。
      </Text>
      <LegalSection
        title="1. 接受条款"
        body="使用注册、登录或以其他方式访问服务，即表示您已阅读并同意受本条款约束。若您不同意，请勿使用服务。"
      />
      <LegalSection
        title="2. 服务说明"
        body="服务旨在提供个人记账、预算与相关辅助功能。我们可能不时更新、调整或暂停部分功能，并将通过合理方式告知可能对用户产生重大影响之变更。"
      />
      <LegalSection
        title="3. 账户与安全"
        body="您应妥善保管账户凭证（例如手机号、验证码），对名下账户活动负责。如发现未经授权的使用，请立即通过应用内渠道通知我们。"
      />
      <LegalSection
        title="4. 用户行为规范"
        body="您同意不利用服务从事违法、侵害他人权益、干扰系统运行或违反适用法律法规之行为。我们有权在合理范围内对违规账户采取限制或终止措施。"
      />
      <LegalSection
        title="5. 知识产权"
        body="服务及其内容（含界面、文案、标识等）受适用法律保护。未经书面许可，不得复制、修改、传播或用于商业目的（法律另有规定除外）。"
      />
      <LegalSection
        title="6. 免责声明与责任限制"
        body="在法律允许的最大范围内，服务按「现状」提供。因不可抗力、第三方原因或您自身原因导致的损失，我们将在适用法律允许的范围内限制或免除责任。此处不构成法律意见，具体以适用法域及最终法律文本为准。"
      />
      <LegalSection
        title="7. 条款变更"
        body="我们可能修订本条款。重大变更时将通过应用内提示或其他合理方式通知。您在变更生效后继续使用服务即视为接受修订后的条款。"
      />
      <LegalSection
        title="8. 适用法律与争议"
        body="本条款之解释与争议解决方式（包括管辖法院或仲裁）应由运营主体所在地适用法律及最终书面版本确定；上架各应用商店时请以届时公示为准。"
      />
      <LegalSection
        title="9. 联系我们"
        body="若对本条款有疑问，请通过应用内「设置」或指定客服渠道联系。我们将在合理期限内答复。"
      />
    </LegalDocumentScreen>
  );
}
