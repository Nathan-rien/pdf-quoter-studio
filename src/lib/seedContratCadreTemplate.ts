import { supabase } from "@/integrations/supabase/client";

type TextOpts = {
  zIndex?: number;
  font?: string;
  size?: number;
  color?: string;
  bold?: boolean;
  align?: "left" | "center" | "right" | "justify";
};

function textEl(id: string, x: number, y: number, w: number, h: number, text: string, opts: TextOpts = {}) {
  return {
    id,
    type: "text",
    position: { x, y },
    size: { width: w, height: h },
    zIndex: opts.zIndex ?? 1,
    isDynamic: false,
    aspectRatioLocked: false,
    locked: false,
    content: {
      text,
      htmlContent: undefined,
      fontFamily: opts.font ?? "Inter",
      fontSize: opts.size ?? 9,
      color: opts.color ?? "#1a1a1a",
      bold: opts.bold ?? false,
      italic: false,
      underline: false,
      textAlign: opts.align ?? "justify",
      listType: "none",
      indentLevel: 0,
    },
  };
}

function rectEl(id: string, x: number, y: number, w: number, h: number, fill = "#e8e8e8", bordered = false) {
  return {
    id,
    type: "shape",
    position: { x, y },
    size: { width: w, height: h },
    zIndex: 0,
    isDynamic: false,
    aspectRatioLocked: false,
    locked: false,
    content: {
      shapeType: "rectangle",
      backgroundColor: fill,
      backgroundOpacity: 100,
      cornerRadius: 0,
      border: bordered
        ? { enabled: true, color: "#e5e7eb", width: 1 }
        : { enabled: false, color: "#000", width: 1 },
      innerContent: { alignment: { horizontal: "left", vertical: "top" }, padding: 0 },
    },
  };
}

export function buildPages() {
  return [
    // ================== PAGE 1 — COUVERTURE ==================
    {
      pageNumber: 1,
      title: "Couverture",
      type: "dynamic_partial",
      documentScope: "both",
      elements: [
        rectEl("p1c-banner", 20, 20, 610, 40),
        textEl("p1c-title", 30, 25, 590, 30, "COUVERTURE — CONTRAT CADRE DE PRESTATIONS DE SERVICES", { size: 12, bold: true, color: "#ffffff", align: "left", zIndex: 5 }),
        textEl("p1c-date", 474, 62, 280, 20, "{{DATE}}", { size: 11, bold: true, align: "right", zIndex: 5 }),
        textEl("p1c-lbl-benef", 40, 82, 570, 14, "Bénéficiaire", { bold: true, size: 10, zIndex: 50 }),
        textEl("p1c-lbl-sites", 40, 242, 570, 14, "Sites d'intervention", { bold: true, size: 10, zIndex: 50 }),
        textEl("p1c-lbl-op", 40, 428, 570, 14, "Contact opérationnel", { bold: true, size: 10, zIndex: 50 }),
        textEl("p1c-lbl-prest", 40, 566, 570, 14, "Prestataires extérieurs", { bold: true, size: 10, zIndex: 50 }),
      ],
      dynamicZones: [
        { id: "service_client_info_page1", pageNumber: 1, type: "service_client_info", sourceSheet: "client", isRequired: true, description: "Identité du bénéficiaire", position: { top: 12, height: 13 } },
        { id: "service_site_addresses_page1", pageNumber: 1, type: "service_site_addresses", sourceSheet: "client", isRequired: false, description: "Adresses de sites", position: { top: 30, height: 16 } },
        { id: "service_operational_contact_page1", pageNumber: 1, type: "service_operational_contact", sourceSheet: "client", isRequired: false, description: "Contact opérationnel", position: { top: 52, height: 12 } },
        { id: "service_external_providers_page1", pageNumber: 1, type: "service_external_providers", sourceSheet: "client", isRequired: false, description: "Prestataires extérieurs", position: { top: 69, height: 18 } },
      ],
      staticElements: [],

    },
    // ================== PAGE 2 — PÉRIMÈTRE (ANNEXE 1) ==================
    {
      pageNumber: 2,
      title: "Périmètre d'intervention (Annexe 1)",
      type: "dynamic_partial",
      documentScope: "both",
      elements: [
        rectEl("p2p-banner", 20, 20, 610, 40),
        textEl("p2p-title", 30, 25, 590, 30, "ANNEXE 1 — PÉRIMÈTRE D'INTERVENTION", { size: 12, bold: true, color: "#ffffff", align: "left", zIndex: 5 }),
        // p2p-lbl-summary retiré — la zone dynamique service_options_summary rend déjà son propre titre "Services & packs souscrits"
        textEl("p2p-lbl-tarifs", 40, 330, 570, 15, "INTERVENTIONS SUR SITE EN SUPPLÉMENT", { font: "Outfit", bold: true, size: 11, color: "#1a1a1a", align: "left", zIndex: 50 }),
        // Tableau statique des tarifs — aligné visuellement sur DATA_TABLE_STYLE / TH_STYLE / TD_STYLE
        // En-tête
        rectEl("p2p-tarif-h-lbl-bg", 40, 352, 340, 18, "#f3f4f6", true),
        textEl("p2p-tarif-h-lbl", 46, 356, 328, 14, "Intervention", { size: 9, bold: true, color: "#1a1a1a", align: "left", zIndex: 2 }),
        rectEl("p2p-tarif-h-val-bg", 380, 352, 230, 18, "#f3f4f6", true),
        textEl("p2p-tarif-h-val", 386, 356, 218, 14, "Tarif", { size: 9, bold: true, color: "#1a1a1a", align: "right", zIndex: 2 }),
        // Ligne 1 (fond blanc)
        rectEl("p2p-tarif-r1-lbl-bg", 40, 370, 340, 18, "#ffffff", true),
        textEl("p2p-tarif-r1-lbl", 46, 374, 328, 14, "Technicien", { size: 9, bold: true, color: "#1a1a1a", align: "left", zIndex: 2 }),
        rectEl("p2p-tarif-r1-val-bg", 380, 370, 230, 18, "#ffffff", true),
        textEl("p2p-tarif-r1-val", 386, 374, 218, 14, "500 € HT", { size: 9, bold: true, color: "#1a1a1a", align: "right", zIndex: 2 }),
        // Ligne 2 (fond alt)
        rectEl("p2p-tarif-r2-lbl-bg", 40, 388, 340, 18, "#f9fafb", true),
        textEl("p2p-tarif-r2-lbl", 46, 392, 328, 14, "Administrateur", { size: 9, bold: true, color: "#1a1a1a", align: "left", zIndex: 2 }),
        rectEl("p2p-tarif-r2-val-bg", 380, 388, 230, 18, "#f9fafb", true),
        textEl("p2p-tarif-r2-val", 386, 392, 218, 14, "600 € HT", { size: 9, bold: true, color: "#1a1a1a", align: "right", zIndex: 2 }),
        // Ligne 3 (fond blanc)
        rectEl("p2p-tarif-r3-lbl-bg", 40, 406, 340, 18, "#ffffff", true),
        textEl("p2p-tarif-r3-lbl", 46, 410, 328, 14, "Ingénieur serveur réseau", { size: 9, bold: true, color: "#1a1a1a", align: "left", zIndex: 2 }),
        rectEl("p2p-tarif-r3-val-bg", 380, 406, 230, 18, "#ffffff", true),
        textEl("p2p-tarif-r3-val", 386, 410, 218, 14, "900 € HT", { size: 9, bold: true, color: "#1a1a1a", align: "right", zIndex: 2 }),
        textEl("p2p-lbl-cond", 40, 500, 570, 14, "MODALITÉS DE RÈGLEMENT", { font: "Outfit", bold: true, size: 11, color: "#1a1a1a", align: "left", zIndex: 50 }),
      ],
      dynamicZones: [
        { id: "service_options_summary_page2", pageNumber: 2, type: "service_options_summary", sourceSheet: "options", isRequired: false, description: "Résumé des services/packs cochés", position: { top: 11, height: 19 } },
        { id: "service_conditions_page2", pageNumber: 2, type: "service_conditions", sourceSheet: "données", isRequired: false, description: "Modalités de règlement", position: { top: 65, height: 24 } },
      ],

      staticElements: [],
    },
    // ================== PAGE 3 — MATÉRIEL ==================
    {
      pageNumber: 3,
      title: "Matériel",
      type: "dynamic_partial",
      documentScope: "both",
      elements: [
        rectEl("p3m-banner", 20, 20, 610, 40),
        textEl("p3m-title", 30, 25, 590, 30, "MATÉRIEL", { size: 12, bold: true, color: "#ffffff", align: "left", zIndex: 5 }),
        textEl("p3m-lbl-invest", 40, 66, 570, 14, "Matériel concerné", { bold: true, size: 10, zIndex: 50 }),
        textEl("p3m-lbl-options", 40, 442, 570, 14, "Options souscrites (détail)", { bold: true, size: 10, zIndex: 50 }),
      ],
      dynamicZones: [
        { id: "service_invest_table_page3", pageNumber: 3, type: "service_invest_table", sourceSheet: "invest_services", isRequired: false, description: "Matériel concerné", position: { top: 11, height: 33 } },
        { id: "service_options_page3", pageNumber: 3, type: "service_options", sourceSheet: "options", isRequired: false, description: "Options détaillées (sans prix)", position: { top: 56, height: 35 }, hidePrice: true },

      ],

      staticElements: [],
    },
    // ================== PAGES CG (ex-1 à ex-6, renumérotées 4-9) ==================
    {
      pageNumber: 4,
      title: "Entre les soussignées",
      type: "dynamic_partial",
      documentScope: "contrat",
      elements: [
        rectEl("p1-banner", 20, 20, 610, 40),
        textEl("p1-title", 30, 25, 590, 30, "CONTRAT CADRE DE PRESTATIONS DE SERVICES", { size: 12, bold: true, align: "left" }),
        textEl("p1-date", 474, 62, 280, 20, "{{DATE}}", { size: 11, bold: true, color: "#ffffff", align: "right", zIndex: 5 }),
        textEl("p1-ss", 40, 80, 570, 15, "ENTRE LES SOUSSIGNEES :", { bold: true }),
        textEl(
          "p1-cybertek",
          40,
          105,
          570,
          140,
          "1/ - La Société « Groupe Cybertek », société par actions simplifiée au capital de 4 471 800 Euros, ayant son siège social à BORDEAUX (33300), Zone d'activités Achard Bat U 130 rue Achard, immatriculée au registre du commerce et des sociétés de Bordeaux sous le numéro 408 772 960,\n\nReprésentée par Nicolas Sourroubille, agissant en qualité de Directeur Général, dûment habilité aux fins des présentes."
        ),
        textEl("p1-prest", 40, 260, 570, 20, 'Ci-après dénommée le "PRESTATAIRE"', { align: "center", bold: true }),
        textEl("p1-dune", 40, 285, 570, 15, "D'UNE PART", { align: "center", bold: true }),
        textEl("p1-et", 40, 315, 570, 15, "Et"),
        textEl("p1-benef-label", 40, 345, 570, 15, "2 - La Société", { bold: true }),
      ],
      dynamicZones: [
        {
          id: "service_client_info_page4",
          pageNumber: 4,
          type: "service_client_info",
          sourceSheet: "client",
          isRequired: true,
          description: "Identité du bénéficiaire",
          position: { top: 82, height: 10 },
        },
      ],
      staticElements: [],
    },
    {
      pageNumber: 5,
      title: "Exposé préalable + Art. I et II",
      type: "static",
      documentScope: "contrat",
      elements: [
        rectEl("p2-banner", 20, 20, 610, 40),
        textEl("p2-title", 30, 25, 590, 30, "EXPOSE PREALABLE", { size: 12, bold: true, align: "left" }),
        textEl(
          "p2-body",
          40,
          75,
          570,
          380,
          "Le présent Contrat Cadre a pour objet de déterminer les conditions dans lesquelles la société Groupe Cybertek SAS fournira des prestations de services objets des présentes au client.\n\nCes prestations reposent, d'une part, sur le présent contrat-cadre de prestations de services, comprenant les conditions générales exposées ci-après, et, d'autre part, sur le contrat d'application, comprenant les conditions particulières, annexé aux présentes (Annexe 1).\n\nLa nature et la liste des produits concernés par les prestations font l'objet d'une description annexée aux présentes qui figure dans le contrat d'application (Annexe 1).\n\nCela étant exposé, il a été convenu et arrêté ce qui suit :"
        ),
        textEl("p2-art1", 40, 475, 570, 15, "I - DEFINITION DES SERVICES RENDUS", { bold: true }),
        textEl(
          "p2-art1-body",
          40,
          500,
          570,
          70,
          "Par le présent Contrat Cadre de prestations de services, le PRESTATAIRE s'engage à fournir au BENEFICIAIRE les prestations dont les conditions particulières et la liste descriptive sont annexées aux présentes (Annexe 1)."
        ),
        textEl("p2-art2", 40, 590, 570, 15, "II - PRESTATIONS", { bold: true }),
        textEl(
          "p2-art2-body",
          40,
          615,
          570,
          120,
          "Les prestations rendues par le PRESTATAIRE regroupent l'ensemble des offres de services, décrites dans l'annexe : Contrat d'Application et consistant en la supervision du parc informatique du BENEFICIAIRE.\n\nLors de la signature du contrat cadre le BENEFICIAIRE choisira les services auxquels il souhaite souscrire. A ce titre, les Parties signeront le contrat d'application annexé aux présentes."
        ),
      ],
      dynamicZones: [],
      staticElements: [],
    },
    {
      pageNumber: 6,
      title: "Art. III à V",
      type: "static",
      documentScope: "contrat",
      elements: [
        textEl("p3-art3", 40, 50, 570, 15, "III - OBLIGATIONS GENERALES DU PRESTATAIRE", { bold: true }),
        textEl(
          "p3-art3-body",
          40,
          75,
          570,
          230,
          "2.1 La Société PRESTATAIRE s'engage à mettre en œuvre, pour l'exécution de l'ensemble des prestations à sa charge en vertu des présentes, toute la diligence requise et à faire tout ce qui est en son pouvoir pour que les conseils et recommandations donnés à la Société BENEFICIAIRE et les services qui sont rendus, donnent toute satisfaction à celle-ci.\n\n2.2 La Société PRESTATAIRE s'engage à affecter à l'exécution des présentes un interlocuteur compétent et spécialisé. Elle pourra également faire appel à des consultants extérieurs ou sous-traiter, sans toutefois qu'il en résulte une quelconque atténuation de sa responsabilité.\n\n2.3 La Société PRESTATAIRE décidera seule du choix du personnel salarié ou non devant être affecté aux missions dont elle a la charge."
        ),
        textEl("p3-art4", 40, 320, 570, 15, "IV - OBLIGATIONS DU BENEFICIAIRE", { bold: true }),
        textEl(
          "p3-art4-body",
          40,
          345,
          570,
          90,
          "La Société BENEFICIAIRE s'engage expressément à fournir, pendant toute la durée du présent contrat, au PRESTATAIRE, toutes les informations, tous les renseignements, tous les documents et toute l'assistance raisonnablement nécessaires pour lui permettre de réaliser l'objet du contrat."
        ),
        textEl("p3-art5", 40, 450, 570, 15, "V - FACTURATION", { bold: true }),
        textEl(
          "p3-art5-body",
          40,
          475,
          570,
          180,
          "La rémunération des prestations définies dans le contrat d'application fera l'objet d'une redevance dont le montant et la périodicité sont précisés dans le contrat d'application annexé aux présentes.\n\nLes Prestations seront facturées dès la signature du contrat d'application par le client. A défaut de paiement de la somme due, LE PRESTATAIRE se réserve le droit de suspendre l'exécution des prestations, 10 jours après mise en demeure de règlement demeurée infructueuse.\n\nLe BENEFICIAIRE accepte toute information par voie électronique ainsi que la fourniture de toute pièce de facturation sous format électronique."
        ),
      ],
      dynamicZones: [],
      staticElements: [],
    },
    {
      pageNumber: 7,
      title: "Art. VI à VIII + Conditions particulières",
      type: "static",
      documentScope: "contrat",
      elements: [
        textEl("p4-art6", 40, 50, 570, 15, "VI - DUREE", { bold: true }),
        textEl(
          "p4-art6-body",
          40,
          75,
          570,
          130,
          "Le présent contrat cadre est conclu pour une durée indéterminée. Il pourra être rompu par l'une ou l'autre des Parties, à sa date anniversaire par l'envoi d'une lettre recommandée avec avis de réception à l'autre Partie en respectant un préavis de 3 mois.\n\nEn revanche, le contrat d'application est conclu pour une durée ferme, déterminée par décision du BÉNÉFICIAIRE. À son terme, il pourra être renouvelé au moyen de la signature d'un nouveau contrat d'application."
        ),
        textEl("p4-art7", 40, 220, 570, 15, "VII - RESOLUTION DU CONTRAT", { bold: true }),
        textEl(
          "p4-art7-body",
          40,
          245,
          570,
          110,
          "En cas de non-respect par l'une ou l'autre des parties des obligations suivantes :\n- Défaut de paiement de la facturation par le BENEFICIAIRE,\n- Défaillance d'une des Parties dans le respect des obligations visées aux articles du présent contrat, celui-ci pourra être résolu au gré de la partie lésée, TRENTE (30) jours après mise en demeure restée sans effet."
        ),
        textEl("p4-art8", 40, 370, 570, 15, "VIII - OBLIGATIONS DE DISCRETION - CONFIDENTIALITE", { bold: true }),
        textEl(
          "p4-art8-body",
          40,
          395,
          570,
          80,
          "Les parties s'engagent à considérer comme strictement confidentiels l'ensemble des documents, informations et données communiqués dans le cadre du présent contrat, pendant toute sa durée et sans limitation après son expiration."
        ),
      ],
      dynamicZones: [],
      staticElements: [],
    },
    {
      pageNumber: 8,
      title: "Art. IX à XII",
      type: "static",
      documentScope: "contrat",
      elements: [
        textEl("p5-art9", 40, 50, 570, 15, "IX - CLAUSES DU CONTRAT", { bold: true }),
        textEl(
          "p5-art9-body",
          40,
          75,
          570,
          60,
          "Les parties conviennent expressément qu'aucune des clauses du contrat ne pourra être réputée comminatoire ou de style, mais qu'elles doivent toutes recevoir leur pleine et entière exécution."
        ),
        textEl("p5-art10", 40, 150, 570, 15, "X - INDEPENDANCE DES CLAUSES", { bold: true }),
        textEl(
          "p5-art10-body",
          40,
          175,
          570,
          70,
          "Toute disposition du présent contrat qui serait ou deviendrait illégale sera entièrement indépendante ; les autres dispositions n'en seront pas affectées et produiront leurs effets."
        ),
        textEl("p5-art11", 40, 260, 570, 15, "XI - INDEPENDANCE DES PARTIES", { bold: true }),
        textEl(
          "p5-art11-body",
          40,
          285,
          570,
          110,
          "Les parties déclarent expressément qu'elles sont et demeureront des partenaires commerciaux et professionnels indépendants, assumant chacun les risques et conséquences de leur propre exploitation. Aucun lien de subordination ne saurait être recherché dans le présent Contrat de services."
        ),
        textEl("p5-art12", 40, 410, 570, 15, "XII - ELECTION DE DOMICILE - ATTRIBUTION DE JURIDICTION - CONVENTION DE PREUVE", { bold: true }),
        textEl(
          "p5-art12-body",
          40,
          445,
          570,
          160,
          "Pour l'exécution des présentes, les parties font élection de domicile en leur siège respectif. Pour tous litiges relatifs à l'exécution ou à l'interprétation du présent Contrat, les parties attribuent expressément compétence aux juridictions de BORDEAUX.\n\nLe BENEFICIAIRE accepte que les signatures électroniques et documents électroniques aient même valeur juridique que leurs équivalents manuscrits."
        ),
      ],
      dynamicZones: [],
      staticElements: [],
    },
    {
      pageNumber: 9,
      title: "Signatures",
      type: "dynamic_partial",
      documentScope: "contrat",
      elements: [
        textEl("p6-fait", 40, 50, 200, 15, "Fait à"),
        textEl("p6-le", 40, 70, 300, 15, "Le _________________________"),
      ],
      dynamicZones: [
        {
          id: "service_signature_page9",
          pageNumber: 9,
          type: "service_signature",
          sourceSheet: "client",
          isRequired: true,
          description: "Signatures des parties",
          position: { top: 70, height: 15 },
        },
      ],
      staticElements: [],
    },
  ];
}

/**
 * Publie une version "propre" du template Contrat Cadre Services à partir
 * du seed statique. Si le template existe déjà, on ajoute une nouvelle
 * version publiée (max(version_number)+1) plutôt que de retourner
 * silencieusement — sinon les correctifs du seed ne seraient jamais
 * appliqués sur les templates historiques.
 */
export async function seedContratCadreTemplate(
  _force = true
): Promise<{ alreadyExists: boolean; templateId: string; versionId: string }> {
  // 1. Récupérer / créer le template
  const { data: existingTemplates, error: existingErr } = await supabase
    .from("pdf_templates")
    .select("id")
    .eq("name", "Contrat Cadre Services")
    .order("updated_at", { ascending: false });
  if (existingErr) throw existingErr;

  let templateId = existingTemplates?.[0]?.id as string | undefined;
  const alreadyExists = !!templateId;

  if (!templateId) {
    const { data: tpl, error: tplErr } = await supabase
      .from("pdf_templates")
      .insert({
        name: "Contrat Cadre Services",
        description: "Contrat cadre de prestations de services - généré automatiquement",
        is_active: false,
        target_view: "services",
      })
      .select("id")
      .single();
    if (tplErr) throw tplErr;
    templateId = tpl.id;
  } else {
    const { error: updateErr } = await supabase
      .from("pdf_templates")
      .update({
        description: "Contrat cadre de prestations de services - généré automatiquement",
        target_view: "services",
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId);
    if (updateErr) throw updateErr;
  }

  // 2. Calculer le prochain numéro de version
  const { data: last, error: lastErr } = await supabase
    .from("template_versions")
    .select("version_number")
    .eq("template_id", templateId!)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastErr) throw lastErr;
  const nextVersion = (last?.version_number ?? 0) + 1;

  const pages = buildPages();

  const { data: ver, error: verErr } = await supabase
    .from("template_versions")
    .insert({
      template_id: templateId!,
      version_number: nextVersion,
      status: "publie",
      published_at: new Date().toISOString(),
      pages: pages as unknown as never,
    })
    .select("id")
    .single();
  if (verErr) throw verErr;

  return { alreadyExists, templateId: templateId!, versionId: ver.id };
}
