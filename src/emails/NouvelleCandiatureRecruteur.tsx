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
  candidatePhone: string;
  candidateEmail?: string;
  jobTitle: string;
  jobCity: string;
  availability: string;
  licenses: string[];
  hasCaces: boolean;
  cacesTypes: string[];
  coverMessage?: string;
  orgName: string;
  dashboardUrl: string;
}

const AVAIL_LABELS: Record<string, string> = {
  immediate: "Immédiatement",
  "1_semaine": "Dans 1 semaine",
  "1_mois": "Dans 1 mois",
};

export default function NouvelleCandiatureRecruteurEmail({
  candidateName = "Jean Dupont",
  candidatePhone = "+32 4XX XX XX XX",
  candidateEmail,
  jobTitle = "Chauffeur PL",
  jobCity = "Bruxelles",
  availability = "immediate",
  licenses = [],
  hasCaces = false,
  cacesTypes = [],
  coverMessage,
  orgName = "HardSwork",
  dashboardUrl = "https://hardswork.vercel.app/dashboard",
}: Props) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>
        Nouveau candidat : {candidateName} pour {jobTitle} — {jobCity}
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
            <Row>
              <Column>
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
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text
                  style={{
                    margin: 0,
                    fontSize: "10px",
                    fontWeight: "700",
                    color: "#ffffff",
                    backgroundColor: "#D93B12",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    display: "inline-block",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  🔔 Nouvelle candidature
                </Text>
              </Column>
            </Row>
          </Container>
        </Section>

        <Container
          style={{ maxWidth: "560px", margin: "0 auto", padding: "0 24px" }}
        >
          {/* ── TITLE ──────────────────────────────────────── */}
          <Section style={{ padding: "24px 0 0 0" }}>
            <Heading
              style={{
                fontSize: "22px",
                fontWeight: "900",
                color: "#0F0E0D",
                margin: "0 0 6px 0",
                letterSpacing: "-0.02em",
              }}
            >
              {candidateName} a postulé
            </Heading>
            <Text style={{ fontSize: "13px", color: "#6B6B60", margin: 0 }}>
              Pour :{" "}
              <strong style={{ color: "#0F0E0D" }}>{jobTitle}</strong> ·{" "}
              {jobCity}
            </Text>
          </Section>

          {/* ── CANDIDATE CARD ─────────────────────────────── */}
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              marginTop: "16px",
              border: "1px solid #E8E8E0",
            }}
          >
            <Text
              style={{
                fontSize: "10px",
                fontWeight: "700",
                color: "#D93B12",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin: "0 0 18px 0",
              }}
            >
              Profil du candidat
            </Text>

            {/* Name + Availability */}
            <Row style={{ marginBottom: "16px" }}>
              <Column style={{ width: "50%" }}>
                <Text
                  style={{
                    fontSize: "10px",
                    color: "#9B9B90",
                    margin: "0 0 3px 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Nom
                </Text>
                <Text
                  style={{
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#0F0E0D",
                    margin: 0,
                  }}
                >
                  {candidateName}
                </Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text
                  style={{
                    fontSize: "10px",
                    color: "#9B9B90",
                    margin: "0 0 3px 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Disponibilité
                </Text>
                <Text
                  style={{
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#0F0E0D",
                    margin: 0,
                  }}
                >
                  {AVAIL_LABELS[availability] ?? availability}
                </Text>
              </Column>
            </Row>

            <Hr
              style={{
                border: "none",
                borderTop: "1px solid #E8E8E0",
                margin: "0 0 16px 0",
              }}
            />

            {/* Phone highlight box */}
            <Section
              style={{
                backgroundColor: "#FEF0EC",
                borderRadius: "10px",
                padding: "14px 18px",
                marginBottom: "16px",
                border: "1px solid #FADDCC",
              }}
            >
              <Text
                style={{
                  fontSize: "10px",
                  color: "#D93B12",
                  margin: "0 0 4px 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: "700",
                }}
              >
                📞 Contact direct
              </Text>
              <Text
                style={{
                  fontSize: "22px",
                  fontWeight: "900",
                  color: "#D93B12",
                  margin: "0 0 2px 0",
                  letterSpacing: "-0.01em",
                }}
              >
                {candidatePhone}
              </Text>
              {candidateEmail && (
                <Text style={{ fontSize: "12px", color: "#6B6B60", margin: 0 }}>
                  <a
                    href={`mailto:${candidateEmail}`}
                    style={{ color: "#6B6B60", textDecoration: "none" }}
                  >
                    {candidateEmail}
                  </a>
                </Text>
              )}
            </Section>

            {/* Licenses + CACES */}
            <Row style={{ marginBottom: coverMessage ? "16px" : "0" }}>
              <Column style={{ width: "50%" }}>
                <Text
                  style={{
                    fontSize: "10px",
                    color: "#9B9B90",
                    margin: "0 0 4px 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Permis
                </Text>
                <Text
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#0F0E0D",
                    margin: 0,
                  }}
                >
                  {licenses.length > 0 ? licenses.join(", ") : "Aucun"}
                </Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text
                  style={{
                    fontSize: "10px",
                    color: "#9B9B90",
                    margin: "0 0 4px 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  CACES
                </Text>
                <Text
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#0F0E0D",
                    margin: 0,
                  }}
                >
                  {hasCaces
                    ? cacesTypes.length > 0
                      ? cacesTypes.join(", ")
                      : "Oui"
                    : "Non"}
                </Text>
              </Column>
            </Row>

            {/* Cover message */}
            {coverMessage && (
              <>
                <Hr
                  style={{
                    border: "none",
                    borderTop: "1px solid #E8E8E0",
                    margin: "16px 0",
                  }}
                />
                <Text
                  style={{
                    fontSize: "10px",
                    color: "#9B9B90",
                    margin: "0 0 8px 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Message du candidat
                </Text>
                <Text
                  style={{
                    fontSize: "13px",
                    color: "#3B3B30",
                    lineHeight: "1.7",
                    margin: 0,
                    fontStyle: "italic",
                    backgroundColor: "#F5F5F0",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                >
                  &ldquo;{coverMessage}&rdquo;
                </Text>
              </>
            )}
          </Section>

          {/* ── CTA ────────────────────────────────────────── */}
          <Section style={{ textAlign: "center", padding: "28px 0 16px 0" }}>
            <Button
              href={dashboardUrl}
              style={{
                backgroundColor: "#D93B12",
                color: "#ffffff",
                padding: "14px 36px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "700",
                textDecoration: "none",
                letterSpacing: "-0.01em",
              }}
            >
              Voir dans le dashboard →
            </Button>
            <Text
              style={{
                fontSize: "11px",
                color: "#9B9B90",
                marginTop: "12px",
                marginBottom: 0,
              }}
            >
              Gérez toutes vos candidatures sur HardSwork
            </Text>
          </Section>

          {/* ── FOOTER ─────────────────────────────────────── */}
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
              {orgName} reçoit cet email via la plateforme HardSwork.
              <br />
              <a
                href="https://hardswork.vercel.app/legal/privacy"
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
