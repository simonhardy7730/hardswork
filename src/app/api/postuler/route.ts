import { NextRequest, NextResponse } from "next/server";
import { cvToken, cvLink } from "@/lib/candidate/cv-link";
import { sanitizeSource } from "@/lib/source";
import { asCv } from "@/lib/candidate/cv";
import { cvFilled } from "@/lib/candidate/pool-cv";
import { checkCvFile } from "@/lib/candidate/cv-file";
import { sanitizeMini, miniToCv, MINI_SUFFIX, type MiniDoc } from "@/lib/candidate/mini-cv";
import { publicOrgName } from "@/lib/confidential";
import { createClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import { render } from "@react-email/render";
import CandidatureConfirmationEmail from "@/emails/CandidatureConfirmation";
import NouvelleCandiatureRecruteurEmail from "@/emails/NouvelleCandiatureRecruteur";
import { allow, clientKey, verifyTurnstile } from "@/lib/security/abuse";
import { ageFromBirthDate, MIN_AGE } from "@/lib/candidate/age";
import { sanitizeAnswers, sanitizeScreeningIds } from "@/lib/screening";
import { guessTrades } from "@/lib/candidate/trades";
import { SECTOR_LABELS, AVAILABILITY_LABELS } from "@/lib/utils";
import { VISIBILITY_CONSENT_VERSION } from "@/lib/candidate/visibility";
import { ADULT_AGE } from "@/lib/candidate/age";

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    // JSON classique, ou multipart (champ « data » en JSON + fichier « cv » optionnel).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any = {};
    let cvFile: File | null = null;
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData();
      try { body = JSON.parse(String(form.get("data") ?? "{}")); } catch { body = {}; }
      const f = form.get("cv");
      if (f instanceof File && f.size > 0) cvFile = f;
    } else {
      body = await req.json();
    }

    // Anti-bot (Cloudflare Turnstile) : actif dès que TURNSTILE_SECRET_KEY est défini.
    if (!(await verifyTurnstile(body?.turnstile_token, req))) {
      return NextResponse.json({ error: "Vérification anti-robot échouée. Rechargez la page." }, { status: 400 });
    }

    // Limitation de débit : 5 candidatures / 10 min et 20 / jour par visiteur.
    const who = clientKey(req);
    if (!(await allow(supabaseAdmin, `apply:${who}:10m`, 600, 5)) || !(await allow(supabaseAdmin, `apply:${who}:1d`, 86400, 20))) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
    }

    // Validation stricte côté serveur : rien de ce qui vient du navigateur n'est de confiance.
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const list = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length <= 20).slice(0, max) : []);
    const job_offer_id = str(body?.job_offer_id, 40);
    const applicant_name = str(body?.applicant_name, 120);
    const applicant_phone = str(body?.applicant_phone, 25);
    const applicant_email = str(body?.applicant_email, 254).toLowerCase();
    const availability = ["immediate", "1_semaine", "1_mois"].includes(body?.availability) ? body.availability : "immediate";
    const licenses = list(body?.licenses, 10);
    const has_caces = body?.has_caces === true;
    const caces_types = list(body?.caces_types, 10);
    const cover_message = str(body?.cover_message, 300);
    const quick_apply = body?.quick_apply === true;
    const birth_date = str(body?.birth_date, 10);
    const age = ageFromBirthDate(birth_date);
    if (age === null || age < MIN_AGE) {
      return NextResponse.json({ error: "age" }, { status: 400 });
    }

    const DAY_OK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun", "holiday"];
    const SLOT_OK = ["morning", "afternoon", "evening", "night"];
    const slotsClean: string[] = Array.from(new Set(list(body?.availability_slots, 40).filter((s) => {
      const [d, t] = s.split(":");
      return DAY_OK.includes(d) && SLOT_OK.includes(t);
    })));

    if (
      !/^[0-9a-f-]{36}$/i.test(job_offer_id) ||
      applicant_name.length < 2 ||
      !/^[+\d][\d\s().\-/]{6,24}$/.test(applicant_phone) ||
      (applicant_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant_email))
    ) {
      return NextResponse.json({ error: "Champs requis manquants ou invalides" }, { status: 400 });
    }

    // Fetch job offer + org email
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from("job_offers")
      .select("*, organizations(name, email)")
      .eq("id", job_offer_id)
      .eq("status", "active")
      .single();

    if (jobError || !jobData) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    // Annonce WOLKO Flash expirée : plus de nouvelles candidatures (contrôle serveur, indépendant du cron)
    const expiresAt = (jobData as { expires_at?: string | null }).expires_at;
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    // Déjà candidaté à cette offre (même téléphone ou même e-mail) : refus automatique, rien n'est créé ni envoyé.
    const { data: dupPhone } = await supabaseAdmin
      .from("applications").select("id").eq("job_offer_id", job_offer_id).eq("applicant_phone", applicant_phone).limit(1);
    const dupEmail = applicant_email
      ? (await supabaseAdmin.from("applications").select("id").eq("job_offer_id", job_offer_id).ilike("applicant_email", applicant_email).limit(1)).data
      : null;
    if ((dupPhone && dupPhone.length > 0) || (dupEmail && dupEmail.length > 0)) {
      return NextResponse.json({ error: "already_applied" }, { status: 409 });
    }

    // Questions de présélection : on ne retient que les réponses aux questions réellement demandées par l'offre.
    const screeningAnswers = sanitizeAnswers(body?.screening_answers, sanitizeScreeningIds((jobData as { screening_ids?: unknown }).screening_ids));
    const requiredIds = sanitizeScreeningIds((jobData as { screening_ids?: unknown }).screening_ids);
    if (requiredIds.length && (!screeningAnswers || requiredIds.some((i) => typeof screeningAnswers[i] !== "boolean"))) {
      return NextResponse.json({ error: "Questions de présélection incomplètes" }, { status: 400 });
    }

    // Insert application
    const baseRow = {
        job_offer_id,
        applicant_name,
        applicant_phone,
        applicant_email: applicant_email || null,
        availability: availability || "immediate",
        licenses: licenses || [],
        has_caces: has_caces || false,
        caces_types: caces_types || [],
        cover_message: cover_message || null,
        status: "nouveau",
        birth_date,
    };
    let { data: application, error: insertError } = await supabaseAdmin
      .from("applications")
      .insert((quick_apply ? { ...baseRow, availability_slots: slotsClean, interest_confirmed: true, quick_apply: true } : baseRow) as typeof baseRow)
      .select()
      .single();
    // Migration 011 pas encore appliquée : on enregistre sans les nouveaux champs.
    if (insertError && quick_apply && /availability_slots|interest_confirmed|quick_apply/.test(insertError.message ?? "")) {
      ({ data: application, error: insertError } = await supabaseAdmin.from("applications").insert(baseRow).select().single());
    }

    // Migration 021 pas encore appliquée : on enregistre sans la date de naissance.
    if (insertError && /birth_date/.test(insertError.message ?? "")) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { birth_date: _omit, ...withoutBirth } = baseRow;
      const row = quick_apply ? { ...withoutBirth, availability_slots: slotsClean, interest_confirmed: true, quick_apply: true } : withoutBirth;
      ({ data: application, error: insertError } = await supabaseAdmin.from("applications").insert(row as typeof withoutBirth).select().single());
      if (insertError && quick_apply && /availability_slots|interest_confirmed|quick_apply/.test(insertError.message ?? "")) {
        ({ data: application, error: insertError } = await supabaseAdmin.from("applications").insert(withoutBirth).select().single());
      }
      if (!insertError) console.error("applications.birth_date manquante : lancer la migration 021");
    }

    // Réponses de présélection (migration 025) : enregistrées à part, sans jamais bloquer la candidature.
    if (!insertError && application && screeningAnswers) {
      const { error: sErr } = await supabaseAdmin.from("applications").update({ screening_answers: screeningAnswers }).eq("id", application.id);
      if (sErr) console.error("applications.screening_answers manquante : lancer la migration 025", sErr.message);
    }

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la candidature" },
        { status: 500 }
      );
    }

    // CV déposé sans compte (facultatif) : fichier privé, lisible seulement par l'entreprise via un lien temporaire.
    // Un échec ne doit jamais faire perdre la candidature.
    // Provenance (migration 033) : jamais bloquante.
    {
      const src = sanitizeSource(body?.source);
      if (src) { const { error: sErr } = await supabaseAdmin.from("applications").update({ source: src }).eq("id", application.id); if (sErr) console.error("source:", sErr.message); }
    }

    let cvSaved = false;
    if (cvFile) {
      try {
        const cvType = await checkCvFile(cvFile, 4 * 1024 * 1024);
        if (cvType) {
          const safe = cvFile.name.replace(/[^\w.\-]+/g, "_").slice(-80);
          const path = `applications/${application.id}/${Date.now()}_${safe}`;
          const up = await supabaseAdmin.storage.from("candidate-documents").upload(path, cvFile, { contentType: cvType });
          if (!up.error) {
            const orgR = jobData.organizations;
            const o = Array.isArray(orgR) ? orgR[0] : orgR;
            const { error: cvErr } = await supabaseAdmin.from("cv_requests").insert({
              application_id: application.id,
              organization_id: jobData.organization_id,
              candidate_email: applicant_email || "",
              org_name: o?.name ?? "",
              job_title: jobData.title,
              status: "fulfilled",
              cv_path: path,
              cv_name: cvFile.name.slice(0, 150),
              fulfilled_at: new Date().toISOString(),
            });
            if (cvErr) { console.error("CV row error:", cvErr.message); await supabaseAdmin.storage.from("candidate-documents").remove([path]); }
            else cvSaved = true;
          } else {
            console.error("CV upload error:", up.error.message);
          }
        }
      } catch (e) {
        console.error("CV error:", e);
      }
    }

    // Pas de CV : mini-CV créé à partir des réponses (« As-tu un CV ? » → Non). Sans IA, uniquement ce qu'il a écrit.
    const mini = cvSaved ? null : sanitizeMini(body?.mini_cv);
    let miniCv: ReturnType<typeof miniToCv> | null = null;
    if (mini) {
      try {
        miniCv = miniToCv(mini);
        const sector = (jobData as { sector?: string }).sector;
        const doc: MiniDoc = {
          v: 1,
          cv: miniCv,
          base: {
            name: applicant_name, phone: applicant_phone, email: applicant_email || "",
            city: str(body?.pool_city, 80),
            trades: [], sectors: sector ? [SECTOR_LABELS[sector as keyof typeof SECTOR_LABELS] ?? sector] : [],
            licenses, caces: has_caces ? caces_types : [], languages: [],
            experienceYears: null, availability: AVAILABILITY_LABELS[availability as keyof typeof AVAILABILITY_LABELS] ?? "",
          },
        };
        const path = `applications/${application.id}/mini-cv${MINI_SUFFIX}`;
        const up = await supabaseAdmin.storage.from("candidate-documents")
          .upload(path, new Blob([JSON.stringify(doc)], { type: "application/json" }), { contentType: "application/json", upsert: true });
        if (!up.error) {
          const orgR = jobData.organizations;
          const o = Array.isArray(orgR) ? orgR[0] : orgR;
          const { error: mErr } = await supabaseAdmin.from("cv_requests").insert({
            application_id: application.id, organization_id: jobData.organization_id, candidate_email: applicant_email || "",
            org_name: o?.name ?? "", job_title: jobData.title, status: "fulfilled", cv_path: path,
            cv_name: "CV Wolko (créé en postulant)", fulfilled_at: new Date().toISOString(),
          });
          if (mErr) console.error("mini CV row:", mErr.message);
        } else console.error("mini CV upload:", up.error.message);
      } catch (e) { console.error("mini CV:", e); }
    }

    // Candidathèque : uniquement si le candidat l'a coché lui-même (case décochée par défaut) et s'il est majeur.
    // Un échec ne doit jamais faire perdre la candidature.
    if (body?.pool_optin === true && age >= ADULT_AGE) {
      try {
        const nowIso = new Date().toISOString();
        const [first, ...rest] = applicant_name.split(" ");
        const sector = (jobData as { sector?: string }).sector;
        const trades = guessTrades(String(jobData.title ?? ""));
        const city = str(body?.pool_city, 80) || null;
        const findBy = async (col: "email" | "phone", v: string) =>
          (await supabaseAdmin.from("candidates").select("id, auth_user_id, sectors").eq(col, v).limit(1)).data?.[0] ?? null;
        const existing = (applicant_email ? await findBy("email", applicant_email) : null) ?? (await findBy("phone", applicant_phone));
        let candidateId: string | null = existing?.id ?? null;
        if (existing && !existing.auth_user_id) {
          // Profil créé par une candidature précédente : on le met à jour (le candidat avec compte gère lui-même le sien).
          const sectors = Array.from(new Set([...(existing.sectors ?? []), ...(sector ? [sector] : [])])).slice(0, 12);
          await supabaseAdmin.from("candidates").update({
            phone: applicant_phone, availability, licenses, has_caces, caces_types, sectors, ...(city ? { city } : {}),
            visible_to_recruiters: true, visibility_consent_at: nowIso, visibility_consent_version: `${VISIBILITY_CONSENT_VERSION}-apply`, status: "actif",
          }).eq("id", existing.id);
          if (trades.length) await supabaseAdmin.from("candidates").update({ trades }).eq("id", existing.id).is("trade_other", null);
        } else if (!existing) {
          const { data: created, error: cErr } = await supabaseAdmin.from("candidates").insert({
            first_name: first || applicant_name, last_name: rest.join(" ") || "-", phone: applicant_phone, email: applicant_email || null,
            city, availability, licenses, has_caces, caces_types, sectors: sector ? [sector] : [], status: "actif", organization_id: null,
            visible_to_recruiters: true, visibility_consent_at: nowIso, visibility_consent_version: `${VISIBILITY_CONSENT_VERSION}-apply`,
            birth_date, trades,
          }).select("id").single();
          if (cErr) console.error("pool opt-in insert:", cErr.message);
          candidateId = created?.id ?? null;
        }
        if (candidateId) await supabaseAdmin.from("applications").update({ candidate_id: candidateId }).eq("id", application.id);
        // Son mini-CV devient le CV de son profil (seulement s'il n'en a pas déjà un).
        if (candidateId && miniCv) {
          // cv_data vaut {} par défaut (jamais null) : on ne remplace pas un vrai CV Wolko déjà rempli.
          const { data: cur } = await supabaseAdmin.from("candidates").select("cv_data").eq("id", candidateId).maybeSingle();
          if (!cvFilled(asCv(cur?.cv_data))) await supabaseAdmin.from("candidates").update({ cv_data: miniCv }).eq("id", candidateId);
        }
      } catch (e) {
        console.error("pool opt-in error:", e);
      }
    }

    const orgRaw = jobData.organizations;
    const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
    const orgName: string = org?.name ?? "Wolko";
    const orgEmail: string | undefined = org?.email;
    // Annonce confidentielle : le candidat ne voit jamais le nom de l'entreprise dans ses e-mails.
    const publicName = publicOrgName((jobData as { hide_company?: boolean }).hide_company, orgName, "fr");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
    const dashboardUrl = `${appUrl}/dashboard/offres/${job_offer_id}/candidatures`;

    // Les emails ne doivent jamais faire perdre une candidature : elle est déjà enregistrée.
    // On les attend (pour qu'ils partent réellement sur Vercel) mais on tolère leur échec.
    const sends: Promise<unknown>[] = [];

    // Destinataires : l'e-mail de l'organisation, sinon (ou en plus) les administrateurs et recruteurs du compte.
    const { data: staff } = await supabaseAdmin
      .from("users").select("email").eq("organization_id", jobData.organization_id).in("role", ["admin", "recruiter"]);
    const recipients = Array.from(new Set([orgEmail, ...(staff ?? []).map((u) => u.email as string)]
      .filter((e): e is string => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).map((e) => e.toLowerCase()))).slice(0, 5);

    if (recipients.length > 0) {
      sends.push(resend.emails
        .send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: recipients,
          subject: `🔔 Nouvelle candidature — ${applicant_name} pour ${jobData.title}`,
          html: await render(
            NouvelleCandiatureRecruteurEmail({
              candidateName: applicant_name,
              candidatePhone: applicant_phone,
              candidateEmail: applicant_email,
              jobTitle: jobData.title,
              jobCity: jobData.city,
              availability: availability || "immediate",
              licenses: licenses || [],
              hasCaces: has_caces || false,
              cacesTypes: caces_types || [],
              coverMessage: cover_message,
              orgName,
              dashboardUrl,
            })
          ),
        })
        .then((r) => { if (r.error) console.error("Recruiter email error:", r.error); })
        .catch((err: unknown) => console.error("Recruiter email error:", err)));
    }

    // Send candidate confirmation if email provided
    if (applicant_email) {
      sends.push(resend.emails
        .send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: applicant_email,
          subject: `✅ Candidature reçue — ${jobData.title}${(jobData as { hide_company?: boolean }).hide_company ? "" : ` chez ${orgName}`}`,
          html: await render(
            CandidatureConfirmationEmail({
              candidateName: applicant_name,
              jobTitle: jobData.title,
              jobCity: jobData.city,
              orgName: publicName,
              availability: availability || "immediate",
              cvUrl: cvSaved || miniCv ? null : cvLink(application.id),
            })
          ),
        })
        .then((r) => { if (r.error) console.error("Candidate email error:", r.error); })
        .catch((err: unknown) => console.error("Candidate email error:", err)));
    }

    await Promise.allSettled(sends);

    return NextResponse.json({ success: true, applicationId: application.id, cvToken: cvSaved ? null : cvToken(application.id), miniCv: Boolean(miniCv) });
  } catch (err) {
    console.error("Postuler API error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
