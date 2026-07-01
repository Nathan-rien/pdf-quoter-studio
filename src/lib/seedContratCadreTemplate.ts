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

function rectEl(id: string, x: number, y: number, w: number, h: number, fill = "#e8e8e8") {
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
      border: { enabled: false, color: "#000", width: 1 },
      innerContent: { alignment: { horizontal: "left", vertical: "top" }, padding: 0 },
    },
  };
}

function buildPages() {
  return [
    {
      pageNumber: 1,
      title: "Entre les soussignées",
      type: "dynamic_partial",
      elements: [
        rectEl("p1-banner", 20, 20, 754, 40),
        textEl("p1-title", 30, 25, 734, 30, "CONTRAT CADRE DE PRESTATIONS DE SERVICES", { size: 12, bold: true, align: "left" }),
        textEl("p1-date", 474, 62, 280, 20, "{{DATE}}", { size: 11, bold: true, color: "#ffffff", align: "right", zIndex: 5 }),
        textEl("p1-ss", 40, 80, 714, 15, "ENTRE LES SOUSSIGNEES :", { bold: true }),
        textEl(
          "p1-cybertek",
          40,
          105,
          714,
          80,
          "1/ - La Société « Groupe Cybertek », société par actions simplifiée au capital de 4 471 800 Euros, ayant son siège social à BORDEAUX (33300), Zone d'activités Achard Bat U 130 rue Achard, immatriculée au registre du commerce et des sociétés de Bordeaux sous le numéro 408 772 960,\n\nReprésentée par Nicolas Sourroubille, agissant en qualité de Directeur Général, dûment habilité aux fins des présentes."
        ),
        textEl("p1-prest", 40, 200, 714, 20, 'Ci-après dénommée le "PRESTATAIRE"', { align: "center", bold: true }),
        textEl("p1-dune", 40, 225, 714, 15, "D'UNE PART", { align: "center", bold: true }),
        textEl("p1-et", 40, 250, 714, 15, "Et"),
        textEl("p1-benef-label", 40, 275, 714, 15, "2 - La Société", { bold: true }),
      ],
      dynamicZones: [
        {
          id: "service_client_info_page1",
          pageNumber: 1,
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
      pageNumber: 2,
      title: "Exposé préalable + Art. I et II",
      type: "static",
      elements: [
        rectEl("p2-banner", 20, 20, 754, 40),
        textEl("p2-title", 30, 25, 734, 30, "EXPOSE PREALABLE", { size: 12, bold: true, align: "left" }),
        textEl(
          "p2-body",
          40,
          75,
          714,
          320,
          "Le présent Contrat Cadre a pour objet de déterminer les conditions dans lesquelles la société Groupe Cybertek SAS fournira des prestations de services objets des présentes au client.\n\nCes prestations reposent, d'une part, sur le présent contrat-cadre de prestations de services, comprenant les conditions générales exposées ci-après, et, d'autre part, sur le contrat d'application, comprenant les conditions particulières, annexé aux présentes (Annexe 1).\n\nLa nature et la liste des produits concernés par les prestations font l'objet d'une description annexée aux présentes qui figure dans le contrat d'application (Annexe 1).\n\nCela étant exposé, il a été convenu et arrêté ce qui suit :"
        ),
        textEl("p2-art1", 40, 415, 714, 15, "I - DEFINITION DES SERVICES RENDUS", { bold: true }),
        textEl(
          "p2-art1-body",
          40,
          435,
          714,
          45,
          "Par le présent Contrat Cadre de prestations de services, le PRESTATAIRE s'engage à fournir au BENEFICIAIRE les prestations dont les conditions particulières et la liste descriptive sont annexées aux présentes (Annexe 1)."
        ),
        textEl("p2-art2", 40, 495, 714, 15, "II - PRESTATIONS", { bold: true }),
        textEl(
          "p2-art2-body",
          40,
          515,
          714,
          80,
          "Les prestations rendues par le PRESTATAIRE regroupent l'ensemble des offres de services, décrites dans l'annexe : Contrat d'Application et consistant en la supervision du parc informatique du BENEFICIAIRE.\n\nLors de la signature du contrat cadre le BENEFICIAIRE choisira les services auxquels il souhaite souscrire. A ce titre, les Parties signeront le contrat d'application annexé aux présentes."
        ),
      ],
      dynamicZones: [],
      staticElements: [],
    },
    {
      pageNumber: 3,
      title: "Art. III à V",
      type: "static",
      elements: [
        textEl("p3-art3", 40, 50, 714, 15, "III - OBLIGATIONS GENERALES DU PRESTATAIRE", { bold: true }),
        textEl(
          "p3-art3-body",
          40,
          70,
          714,
          160,
          "2.1 La Société PRESTATAIRE s'engage à mettre en œuvre, pour l'exécution de l'ensemble des prestations à sa charge en vertu des présentes, toute la diligence requise et à faire tout ce qui est en son pouvoir pour que les conseils et recommandations donnés à la Société BENEFICIAIRE et les services qui sont rendus, donnent toute satisfaction à celle-ci.\n\n2.2 La Société PRESTATAIRE s'engage à affecter à l'exécution des présentes un interlocuteur compétent et spécialisé. Elle pourra également faire appel à des consultants extérieurs ou sous-traiter, sans toutefois qu'il en résulte une quelconque atténuation de sa responsabilité.\n\n2.3 La Société PRESTATAIRE décidera seule du choix du personnel salarié ou non devant être affecté aux missions dont elle a la charge."
        ),
        textEl("p3-art4", 40, 245, 714, 15, "IV - OBLIGATIONS DU BENEFICIAIRE", { bold: true }),
        textEl(
          "p3-art4-body",
          40,
          265,
          714,
          60,
          "La Société BENEFICIAIRE s'engage expressément à fournir, pendant toute la durée du présent contrat, au PRESTATAIRE, toutes les informations, tous les renseignements, tous les documents et toute l'assistance raisonnablement nécessaires pour lui permettre de réaliser l'objet du contrat."
        ),
        textEl("p3-art5", 40, 340, 714, 15, "V - FACTURATION", { bold: true }),
        textEl(
          "p3-art5-body",
          40,
          360,
          714,
          100,
          "La rémunération des prestations définies dans le contrat d'application fera l'objet d'une redevance dont le montant et la périodicité sont précisés dans le contrat d'application annexé aux présentes.\n\nLes Prestations seront facturées dès la signature du contrat d'application par le client. A défaut de paiement de la somme due, LE PRESTATAIRE se réserve le droit de suspendre l'exécution des prestations, 10 jours après mise en demeure de règlement demeurée infructueuse.\n\nLe BENEFICIAIRE accepte toute information par voie électronique ainsi que la fourniture de toute pièce de facturation sous format électronique."
        ),
      ],
      dynamicZones: [],
      staticElements: [],
    },
    {
      pageNumber: 4,
      title: "Art. VI à VIII + Conditions particulières",
      type: "dynamic_partial",
      elements: [
        textEl("p4-art6", 40, 50, 714, 15, "VI - DUREE", { bold: true }),
        textEl(
          "p4-art6-body",
          40,
          70,
          714,
          80,
          "Le présent contrat cadre est conclu pour une durée indéterminée. Il pourra être rompu par l'une ou l'autre des Parties, à sa date anniversaire par l'envoi d'une lettre recommandée avec avis de réception à l'autre Partie en respectant un préavis de 3 mois.\n\nEn revanche, le contrat d'application est conclu pour une durée ferme, déterminée par décision du BÉNÉFICIAIRE. À son terme, il pourra être renouvelé au moyen de la signature d'un nouveau contrat d'application."
        ),
        textEl("p4-art7", 40, 165, 714, 15, "VII - RESOLUTION DU CONTRAT", { bold: true }),
        textEl(
          "p4-art7-body",
          40,
          185,
          714,
          80,
          "En cas de non-respect par l'une ou l'autre des parties des obligations suivantes :\n- Défaut de paiement de la facturation par le BENEFICIAIRE,\n- Défaillance d'une des Parties dans le respect des obligations visées aux articles du présent contrat, celui-ci pourra être résolu au gré de la partie lésée, TRENTE (30) jours après mise en demeure restée sans effet."
        ),
        textEl("p4-art8", 40, 280, 714, 15, "VIII - OBLIGATIONS DE DISCRETION - CONFIDENTIALITE", { bold: true }),
        textEl(
          "p4-art8-body",
          40,
          300,
          714,
          100,
          "Les parties s'engagent à considérer comme strictement confidentiels l'ensemble des documents, informations et données communiqués dans le cadre du présent contrat, pendant toute sa durée et sans limitation après son expiration."
        ),
        rectEl("p4-annexe-banner", 20, 415, 754, 30, "#f0f0f0"),
        textEl("p4-annexe-title", 30, 420, 714, 20, "ANNEXE 1 — CONDITIONS PARTICULIERES DU CONTRAT D'APPLICATION", { bold: true, size: 10, align: "left" }),
      ],
      dynamicZones: [
        {
          id: "service_conditions_page4",
          pageNumber: 4,
          type: "service_conditions",
          sourceSheet: "données",
          isRequired: false,
          description: "Durée, périodicité, services souscrits",
          position: { top: 50, height: 12 },
        },
      ],
      staticElements: [],
    },
    {
      pageNumber: 5,
      title: "Art. IX à XII",
      type: "static",
      elements: [
        textEl("p5-art9", 40, 50, 714, 15, "IX - CLAUSES DU CONTRAT", { bold: true }),
        textEl(
          "p5-art9-body",
          40,
          70,
          714,
          45,
          "Les parties conviennent expressément qu'aucune des clauses du contrat ne pourra être réputée comminatoire ou de style, mais qu'elles doivent toutes recevoir leur pleine et entière exécution."
        ),
        textEl("p5-art10", 40, 130, 714, 15, "X - INDEPENDANCE DES CLAUSES", { bold: true }),
        textEl(
          "p5-art10-body",
          40,
          150,
          714,
          60,
          "Toute disposition du présent contrat qui serait ou deviendrait illégale sera entièrement indépendante ; les autres dispositions n'en seront pas affectées et produiront leurs effets."
        ),
        textEl("p5-art11", 40, 225, 714, 15, "XI - INDEPENDANCE DES PARTIES", { bold: true }),
        textEl(
          "p5-art11-body",
          40,
          245,
          714,
          80,
          "Les parties déclarent expressément qu'elles sont et demeureront des partenaires commerciaux et professionnels indépendants, assumant chacun les risques et conséquences de leur propre exploitation. Aucun lien de subordination ne saurait être recherché dans le présent Contrat de services."
        ),
        textEl("p5-art12", 40, 340, 714, 15, "XII - ELECTION DE DOMICILE - ATTRIBUTION DE JURIDICTION - CONVENTION DE PREUVE", { bold: true }),
        textEl(
          "p5-art12-body",
          40,
          360,
          714,
          120,
          "Pour l'exécution des présentes, les parties font élection de domicile en leur siège respectif. Pour tous litiges relatifs à l'exécution ou à l'interprétation du présent Contrat, les parties attribuent expressément compétence aux juridictions de BORDEAUX.\n\nLe BENEFICIAIRE accepte que les signatures électroniques et documents électroniques aient même valeur juridique que leurs équivalents manuscrits."
        ),
      ],
      dynamicZones: [],
      staticElements: [],
    },
    {
      pageNumber: 6,
      title: "Tableau produits + Signatures",
      type: "dynamic_partial",
      elements: [
        textEl("p6-fait", 40, 50, 200, 15, "Fait à"),
        textEl("p6-le", 40, 70, 300, 15, "Le _________________________"),
      ],
      dynamicZones: [
        {
          id: "service_invest_table_page6",
          pageNumber: 6,
          type: "service_invest_table",
          sourceSheet: "invest_services",
          isRequired: false,
          description: "Tableau des produits et services",
          position: { top: 10, height: 25 },
        },
        {
          id: "service_signature_page6",
          pageNumber: 6,
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

export async function seedContratCadreTemplate(force = false): Promise<
  { alreadyExists: true; templateId: string }
  | { alreadyExists: false; templateId: string; versionId: string }
> {
  if (force) {
    await supabase
      .from("pdf_templates")
      .delete()
      .eq("name", "Contrat Cadre Services");
  }

  const { data: existing, error: existingErr } = await supabase
    .from("pdf_templates")
    .select("id")
    .eq("name", "Contrat Cadre Services")
    .limit(1)
    .maybeSingle();

  if (existingErr) throw existingErr;
  if (existing?.id) return { alreadyExists: true, templateId: existing.id };

  const { data: tpl, error: tplErr } = await supabase
    .from("pdf_templates")
    .insert({
      name: "Contrat Cadre Services",
      description: "Contrat cadre de prestations de services - généré automatiquement",
      is_active: false,
    })
    .select("id")
    .single();

  if (tplErr) throw tplErr;

  const pages = buildPages();

  const { data: ver, error: verErr } = await supabase
    .from("template_versions")
    .insert({
      template_id: tpl.id,
      version_number: 1,
      status: "publie",
      published_at: new Date().toISOString(),
      pages: pages as unknown as never,
    })
    .select("id")
    .single();

  if (verErr) throw verErr;

  return { alreadyExists: false, templateId: tpl.id, versionId: ver.id };
}
