import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
  Row,
  Column,
  Preview,
} from "@react-email/components";
import * as React from "react";

interface Props {
  candidateName: string;
  jobTitle: string;
  jobCity: string;
  orgName: string;
  availability: string;
}

const AVAIL_LABELS: Record<string, string> = {
  immediate: "Immédiatement",
  "1_semaine": "Dans 1 semaine",
  "1_mois": "Dans 1 mois",
};

export default function CandidatureConfirmationEmail({
  candidateName = "Jean",
  jobTitle = "Chauffeur PL",
  jobCity = "Bruxelles",
  orgName = "HardSwork",
  availability = "immediate",
}: Props) {
  const firstName = candidateName.split(" ")[0];
  const appUrl = "https://hardswork.vercel.app";

  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>
        Votre candidature a été transmise à {orgName}. Ils vous contacteront
        bientôt.
      </Preview>
      <Body
        style={{
          backgroundColor: "#F5F5F0",
          margin: 0,
          padding: "32px 0",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {/* ── HEADER ─────────────────────────────────────── */}
        <Section style={{ backgroundColor: "#0F0E0D", padding: "20px 0" }}>
          <Container
            style={{ maxWidth: "560px", margin: "0 auto", padding: "0 24px" }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: "900",
                letterSpacing: "-0.02em",
              }}
            >
              <span style={{ color: "#D93B12" }}>HARD</span>
              <span style={{ color: "#ffffff" }}>SWORK</span>
            </Text>
          </Container>
        </Section>

        <Container
          style={{ maxWidth: "560px", margin: "0 auto", padding: "0 24px" }}
        >
          {/* ── SUCCESS CARD ───────────────────────────────── */}
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              marginTop: "24px",
              border: "1px solid #E8E8E0",
            }}
          >
            <Text
              style={{ fontSize: "40px", textAlign: "center", margin: "0 0 8px 0" }}
            >
              ✅
            </Text>
            <Heading
              style={{
                fontSize: "22px",
                fontWeight: "900",
                color: "#0F0E0D",
                textAlign: "center",
                margin: "0 0 10px 0",
                letterSpacing: "-0.02em",
              }}
            >
              Candidature envoyée !
            </Heading>
            <Text
              style={{
                fontSize: "14px",
                color: "#6B6B60",
                textAlign: "center",
                margin: "0 0 24px 0",
                lineHeight: "1.6",
              }}
            >
              Bonjour {firstName}, votre candidature a bien été transmise à{" "}
              <strong style={{ color: "#0F0E0D" }}>{orgName}</strong>.
            </Text>

            <Hr
              style={{
                border: "none",
                borderTop: "1px solid #E8E8E0",
                margin: "0 0 24px 0",
              }}
            />

            {/* Job summary */}
            <Section
              style={{
                backgroundColor: "#F5F5F0",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "24px",
              }}
            >
              <Text
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "#D93B12",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  margin: "0 0 6px 0",
                }}
              >
                Offre postulée
              </Text>
              <Text
                style={{
                  fontSize: "17px",
                  fontWeight: "800",
                  color: "#0F0E0D",
                  margin: "0 0 4px 0",
                  letterSpacing: "-0.01em",
                }}
              >
                {jobTitle}
              </Text>
              <Text style={{ fontSize: "12px", color: "#6B6B60", margin: 0 }}>
                {orgName} · {jobCity} · Disponibilité :{" "}
                {AVAIL_LABELS[availability] ?? availability}
              </Text>
            </Section>

            {/* Next steps */}
            <Text
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#0F0E0D",
                margin: "0 0 14px 0",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Ce qui se passe ensuite
            </Text>

            {[
              {
                n: "1",
                text: `${orgName} reçoit votre profil et l'examine.`,
              },
              {
                n: "2",
                text: "Si votre profil correspond, ils vous contactent directement par téléphone.",
              },
              {
                n: "3",
                text: "Vous démarrez votre nouvelle mission !",
              },
            ].map(({ n, text }) => (
              <Row key={n} style={{ marginBottom: "10px" }}>
                <Column
                  style={{ width: "30px", verticalAlign: "top" }}
                >
                  <Text
                    style={{
                      fontSize: "11px",
                      fontWeight: "900",
                      color: "#D93B12",
                      backgroundColor: "#FEF0EC",
                      borderRadius: "50%",
                      width: "22px",
                      height: "22px",
                      textAlign: "center",
                      lineHeight: "22px",
                      margin: "2px 0 0 0",
                      display: "inline-block",
                    }}
                  >
                    {n}
                  </Text>
                </Column>
                <Column style={{ verticalAlign: "top", paddingLeft: "8px" }}>
                  <Text
                    style={{
                      fontSize: "13px",
                      color: "#6B6B60",
                      margin: 0,
                      lineHeight: "1.6",
                    }}
                  >
                    {text}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Browse more jobs */}
          <Section style={{ textAlign: "center", padding: "24px 0" }}>
            <Text
              style={{
                fontSize: "13px",
                color: "#6B6B60",
                margin: "0 0 16px 0",
              }}
            >
              En attendant, découvrez d&apos;autres opportunités en Belgique
            </Text>
            <Button
              href={`${appUrl}/jobs`}
              style={{
                backgroundColor: "#D93B12",
                color: "#ffffff",
                padding: "12px 28px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              Voir les offres →
            </Button>
          </Section>

          {/* Footer */}
          <Section
            style={{ borderTop: "1px solid #E8E8E0", padding: "20px 0" }}
          >
            <Text
              style={{
                fontSize: "11px",
                color: "#9B9B90",
                textAlign: "center",
                margin: 0,
                lineHeight: "1.7",
              }}
            >
              © 2026 HardSwork · Belgique 🇧🇪
              <br />
              Vous recevez cet email car vous avez postulé via HardSwork.
              <br />
              <a
                href={`${appUrl}/legal/privacy`}
                style={{ color: "#9B9B90" }}
              >
                Politique de confidentialité
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
