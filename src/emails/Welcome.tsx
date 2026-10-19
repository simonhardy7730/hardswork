import { Html, Head, Body, Container, Section, Text, Heading, Button, Link, Img, Hr, Preview } from "@react-email/components";
import * as React from "react";
import { WELCOME, FOOTER, type WelcomeKind, type WelcomeLang } from "./welcome-content";

interface Props {
  kind: WelcomeKind;
  lang: WelcomeLang;
  firstName?: string;
  baseUrl?: string;
}

const NAVY = "#101F43", NAVY2 = "#1C3058", YELLOW = "#FFB900", CREAM = "#FFFBF2";

/** Email de bienvenue WOLKO (candidat / entreprise / agence, FR / NL). React échappe les valeurs injectées. */
export default function WelcomeEmail({ kind, lang, firstName = "", baseUrl = "https://wolko.be" }: Props) {
  const c = WELCOME[kind][lang];
  const f = FOOTER[lang];
  const name = firstName.trim().slice(0, 40);
  const url = `${baseUrl}${c.ctaPath}`;
  const privacyUrl = `${baseUrl}/legal/privacy`;

  return (
    <Html lang={lang} dir="ltr">
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={{ backgroundColor: CREAM, margin: 0, padding: "24px 0", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 12px" }}>
          {/* EN-TÊTE */}
          <Section style={{ backgroundColor: NAVY, borderRadius: "20px 20px 0 0", padding: "26px 24px 0", textAlign: "center" }}>
            <Text style={{ margin: 0, fontSize: "26px", fontWeight: 900, letterSpacing: "4px", color: YELLOW }}>
              WOL<span style={{ color: "#ffffff" }}>KO</span>
            </Text>
            <Img
              src={`${baseUrl}/images/email/wolf-head.png`}
              width="170" height="161" alt="WOLKO — la mascotte loup"
              style={{ display: "block", margin: "18px auto 0", border: 0, color: YELLOW, fontSize: "14px", fontWeight: 700 }}
            />
          </Section>

          {/* CARTE PRINCIPALE */}
          <Section style={{ backgroundColor: "#ffffff", padding: "32px 28px 8px", textAlign: "center", border: "1px solid #EADFC4", borderTop: 0 }}>
            <Text style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 900, letterSpacing: "2px", color: "#B87C2A", textTransform: "uppercase" }}>
              {lang === "nl" ? "Welkom in de roedel! 🐺" : "Bienvenue dans la meute ! 🐺"}
            </Text>
            <Heading as="h1" style={{ margin: "0 0 20px", fontSize: "26px", lineHeight: "1.25", fontWeight: 900, color: NAVY }}>
              {c.title}
            </Heading>
            <Text style={{ margin: "0 0 12px", fontSize: "16px", lineHeight: "1.6", color: NAVY, textAlign: "left", fontWeight: 700 }}>
              {c.greet(name)}
            </Text>
            {c.paragraphs.map((p, i) => (
              <Text key={i} style={{ margin: "0 0 12px", fontSize: "16px", lineHeight: "1.6", color: NAVY2, textAlign: "left" }}>{p}</Text>
            ))}
            <Text style={{ margin: "18px 0 22px", fontSize: "16px", lineHeight: "1.5", color: NAVY, fontWeight: 700, fontStyle: "italic" }}>
              {c.closing}
            </Text>
            <Button href={url} style={{ backgroundColor: YELLOW, color: NAVY, fontWeight: 900, fontSize: "16px", textDecoration: "none", padding: "15px 34px", borderRadius: "12px", display: "inline-block" }}>
              {c.cta}
            </Button>
            <Text style={{ margin: "18px 0 24px", fontSize: "12px", color: "#5A6585", lineHeight: "1.5" }}>
              <Link href={url} style={{ color: "#B87C2A", wordBreak: "break-all" }}>{url}</Link>
            </Text>
          </Section>

          {/* PIED DE PAGE */}
          <Section style={{ backgroundColor: NAVY, borderRadius: "0 0 20px 20px", padding: "24px 24px 26px", textAlign: "center" }}>
            <Text style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 900, letterSpacing: "3px", color: YELLOW }}>
              WOL<span style={{ color: "#ffffff" }}>KO</span>
            </Text>
            <Text style={{ margin: "0 0 12px", fontSize: "13px", color: "#ffffff", fontWeight: 700 }}>{f.tagline}</Text>
            <Hr style={{ border: "none", borderTop: "1px solid #2B3A66", margin: "0 0 12px" }} />
            <Text style={{ margin: "0 0 6px", fontSize: "12px", color: "#9AA5C4" }}>
              <Link href={baseUrl} style={{ color: "#9AA5C4" }}>wolko.be</Link>
              {"  ·  "}
              <Link href={privacyUrl} style={{ color: "#9AA5C4" }}>{f.privacy}</Link>
            </Text>
            <Text style={{ margin: "0 0 4px", fontSize: "11px", color: "#9AA5C4" }}>{f.legal}</Text>
            <Text style={{ margin: 0, fontSize: "11px", color: "#9AA5C4" }}>{f.why}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
