import { api } from "@/lib/api";
import PolicyPageLayout, { PolicyContent } from "@/components/policy/PolicyPageLayout";

const DEFAULT_CONTENT: PolicyContent = {
  heading: "Privacy Policy for Eco Smok",
  intro: "Last Updated: 27-10-2024\n\nEcoSmok.co.uk is committed to respecting and protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your information when you visit our website, www.ecosmok.co.uk (the \"Website\"). By using our Website, you consent to the practices described in this Privacy Policy.",
  sections: [
    { heading: "1. Information We Collect", body: "We may collect both personal and non-personal information to provide and improve our services:\n\nPersonal Information: When you make a purchase, create an account, or contact us, we may collect your name, email address, phone number, mailing address, and payment information.\n\nUsage Information: We may collect data about how you use the Website, including IP address, browser type, device information, pages visited, and other usage data." },
    { heading: "How We Use Your Information", body: "We may use your information for the following purposes:\n\n- To process and fulfill orders\n- To improve our products, services, and customer support\n- To send updates, promotions, and marketing communications, with your consent where required\n- To analyze usage trends and improve our Website\n- To comply with legal requirements and protect our rights" },
    { heading: "Sharing Your Information", body: "We do not sell, trade, or otherwise transfer your personal information to third parties except:\n\nService Providers: We may share information with trusted third-party service providers to help us operate the Website, fulfill orders, and process payments.\n\nLegal Compliance: We may disclose your information to comply with legal obligations, respond to requests from public authorities, and protect our rights and safety." },
    { heading: "Cookies and Tracking Technologies", body: "We use cookies and similar tracking technologies to improve user experience, track usage, and analyze trends. You can adjust your browser settings to refuse cookies; however, this may affect the functionality of our Website." },
    { heading: "Your Rights", body: "Depending on your location, you may have the following rights regarding your personal information:\n\n- Access to your information\n- Correction or deletion of your information\n- Objecting to or restricting the processing of your information\n- Data portability\n- Withdrawal of consent where processing is based on consent\n\nTo exercise any of these rights, please contact us at [info@ecosmok.com](mailto:info@ecosmok.com)." },
    { heading: "Data Security", body: "We take reasonable precautions to secure your information. However, no data transmission over the internet or electronic storage is 100% secure. We cannot guarantee the absolute security of your information." },
    { heading: "Children's Privacy", body: "Our Website is not intended for individuals under the age of 18, and we do not knowingly collect information from children. If you believe we have collected personal information from a child, please contact us to have it removed." },
    { heading: "Changes to This Privacy Policy", body: "We may update this Privacy Policy periodically. We encourage you to review this policy regularly for any changes. Continued use of our Website constitutes acceptance of any updated terms." },
    { heading: "Contact Us", body: "If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:\n\nEcoSmok.co.uk\nEmail: [info@ecosmok.com](mailto:info@ecosmok.com)\nAddress: Eco Smok Store, 23 Lockett Street, Manchester, M8 8EE\n\nCompany number: 10366027" },
  ],
};

export default async function PrivacyPage() {
  const content = (await api.getPrivacyContent().catch(() => null)) as PolicyContent | null;
  return <PolicyPageLayout content={content ?? DEFAULT_CONTENT} />;
}
