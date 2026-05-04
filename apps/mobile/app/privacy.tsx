import { Text } from "@/components/ui/text";
import {
  LegalDocumentScreen,
  LegalSection,
  legalStyles,
} from "@/src/components/legal/LegalDocumentScreen";

const UPDATED = "2026年5月3日";

export default function PrivacyScreen() {
  return (
    <LegalDocumentScreen stackTitle="隐私政策" lastUpdated={UPDATED}>
      <Text style={legalStyles.paragraph}>
        我们重视您的个人信息保护。本政策说明在处理与您相关的个人信息时的原则与做法。本文为合规可用的摘要模板，正式发布前请结合实际上传的隐私清单、第三方 SDK
        情况由法务或数据合规人员审定。
      </Text>
      <LegalSection
        title="1. 适用范围"
        body="本政策适用于您通过移动应用使用我们产品与服务时，我们对相关信息的处理活动。"
      />
      <LegalSection
        title="2. 我们收集的信息"
        body="可能包括：账户与登录信息（如手机号码及验证码流程所需数据）、您主动提供的资料（如昵称）、设备与日志信息（如设备型号、系统版本、崩溃日志，用于保障安全与改进体验）、以及您在使用记账等功能时提交的业务数据。具体范围以实现功能所必需及依法告知同意为前提。"
      />
      <LegalSection
        title="3. 信息的使用目的"
        body="用于：提供与维护服务、身份验证与安全风控、改进产品与统计分析（在合法前提下）、履行法定义务、以及经您同意的其他用途。"
      />
      <LegalSection
        title="4. 存储与安全"
        body="我们将在实现目的所需期限内保存信息，并采取合理的技术与管理措施保护信息安全。任何系统都无法保证绝对安全，请您同样妥善保管账户信息。"
      />
      <LegalSection
        title="5. 共享与第三方"
        body="非经法律法规要求或您的同意，我们不会向第三方出售您的个人信息。为实现功能（如云同步、短信验证、分析工具等），我们可能委托具备资质的合作方处理信息，并要求其承担保密与安全义务。详细清单应在最终版本中列明。"
      />
      <LegalSection
        title="6. 您的权利"
        body="在适用法律允许的范围内，您可查阅、更正、删除与您相关的个人信息，或撤回同意、注销账户等。您可通过应用内入口或联系我们行使权利；我们将在核实身份后依法处理。"
      />
      <LegalSection
        title="7. 未成年人"
        body="若您为未成年人，请在监护人指导下阅读本政策并使用服务。我们不会主动收集不必要的儿童个人信息；如发现误收集，将依法删除。"
      />
      <LegalSection
        title="8. 跨境传输"
        body="若您的信息需跨境传输，我们将遵守适用法律要求，并采取适当保障措施，并在最终版本中说明目的地与机制。"
      />
      <LegalSection
        title="9. 政策更新"
        body="我们可能适时修订本政策。重大变更时将通过应用内提示等方式告知。请定期查阅更新后的版本。"
      />
      <LegalSection
        title="10. 联系我们"
        body="如对本隐私政策有任何疑问、投诉或请求，请通过应用内「设置」或届时公示的联系方式与我们联系。"
      />
    </LegalDocumentScreen>
  );
}
