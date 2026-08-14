import { supabase } from "@/integrations/supabase/client";

type TextOpts = {
  zIndex?: number;
  font?: string;
  size?: number;
  color?: string;
  bold?: boolean;
  align?: "left" | "center" | "right" | "justify";
  fontWeight?: number | string;
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
      ...(opts.fontWeight !== undefined ? { fontWeight: opts.fontWeight } : {}),
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
    // Rendu 100% via le générateur (renderShellPage) : aucun élément statique.
    {
      pageNumber: 1,
      title: "Contrat cadre de prestations de services",
      type: "dynamic_partial",
      documentScope: "both",
      elements: [],
      dynamicZones: [
        { id: "service_client_info_page1", pageNumber: 1, type: "service_client_info", sourceSheet: "client", isRequired: true, description: "Identité du bénéficiaire", position: { top: 12, height: 13 } },
        { id: "service_site_addresses_page1", pageNumber: 1, type: "service_site_addresses", sourceSheet: "client", isRequired: false, description: "Adresses de sites", position: { top: 30, height: 16 } },
        { id: "service_operational_contact_page1", pageNumber: 1, type: "service_operational_contact", sourceSheet: "client", isRequired: false, description: "Contact opérationnel", position: { top: 52, height: 12 } },
        { id: "service_external_providers_page1", pageNumber: 1, type: "service_external_providers", sourceSheet: "client", isRequired: false, description: "Prestataires extérieurs", position: { top: 69, height: 18 } },
      ],
      staticElements: [],
    },
    // ================== PAGE 2 — PÉRIMÈTRE ==================
    {
      pageNumber: 2,
      title: "Périmètre d'intervention",
      type: "dynamic_partial",
      documentScope: "both",
      elements: [],
      dynamicZones: [
        { id: "service_options_summary_page2", pageNumber: 2, type: "service_options_summary", sourceSheet: "options", isRequired: false, description: "Résumé des services/packs cochés", position: { top: 11, height: 19 } },
        { id: "service_tarifs_interventions_page2", pageNumber: 2, type: "service_tarifs_interventions", sourceSheet: "données", isRequired: false, description: "Interventions sur site en supplément", position: { top: 40, height: 24 } },
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
      elements: [],
      dynamicZones: [
        { id: "service_invest_table_page3", pageNumber: 3, type: "service_invest_table", sourceSheet: "invest_services", isRequired: false, description: "Matériel concerné", position: { top: 11, height: 33 } },
        { id: "service_options_page3", pageNumber: 3, type: "service_options", sourceSheet: "options", isRequired: false, description: "Options détaillées (sans prix)", position: { top: 56, height: 35 }, hidePrice: true },
      ],
      staticElements: [],
    },
    // ================== PAGES CG (ex-1 à ex-6, renumérotées 4-9) ==================
    {
      pageNumber: 4,
      title: "Parties contractantes",
      type: "dynamic_partial",
      documentScope: "contrat",
      elements: [
        rectEl("p1-banner", 20, 20, 610, 40, "#1a1a1a"),
        textEl("p1-title", 30, 25, 590, 30, "CONTRAT CADRE DE PRESTATIONS DE SERVICES", { size: 12, bold: true, color: "#ffffff", align: "left" }),
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
          260,
          "1.1 Les prestations rendues par le PRESTATAIRE regroupent l'ensemble des offres de services, décrites dans l'annexe : Contrat d'Application et consistant en la supervision du parc informatique du BENEFICIAIRE.\n\nLors de la signature du contrat cadre le BENEFICIAIRE choisira les services auxquels il souhaite souscrire. A ce titre, les Parties signeront le contrat d'application annexé aux présentes.\n\n1.2 Le service support prévoit le diagnostic et la résolution des problèmes signalés. Il est expressément limité aux systèmes et applications prévus dans le contrat d'application. Ce service est assuré du lundi au vendredi de 9h à 12h30 et de 13h30 à 17h. Dans le cas où les moyens mis en œuvre ne permettraient pas de remédier au dysfonctionnement signalé, un technicien se rendra sur site. Cette prestation fera l'objet d'une facturation spécifique après accord entre le BENEFICIAIRE et le PRESTATAIRE.\n\n1.3 Maintien en condition opérationnelle (MCO). La société PRESTATAIRE assure la surveillance à distance du réseau du BENEFICIAIRE. Pour assurer ce service la société PRESTATAIRE utilise différents outils permettant la remontée des informations nécessaires à la réalisation de cette prestation, ce que le BENEFICIAIRE autorise d'ores et déjà expressément et auquel il s'engage à ne pas faire obstacle.\n\n1.3.1 Nature des données collectées. Les Outils permettent notamment l'inventaire matériel et logiciel des postes et serveurs, la remontée d'alertes techniques, de journaux d'événements et de métriques de fonctionnement, ainsi que, le cas échéant, l'exécution à distance de scripts de maintenance, de mises à jour et de correctifs. Le BENEFICIAIRE reconnaît que ces opérations nécessitent l'installation d'un agent logiciel sur les équipements concernés, et autorise expressément cette installation."
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
          320,
          "1.1 La Société PRESTATAIRE s'engage à mettre en œuvre, pour l'exécution de l'ensemble des prestations à sa charge en vertu des présentes, toute la diligence requise et à faire tout ce qui est en son pouvoir pour que les conseils et recommandations donnés à la Société BENEFICIAIRE et les services qui sont rendus, donnent toute satisfaction à celle-ci.\n\nIl est toutefois expressément reconnu que les obligations souscrites par la Société PRESTATAIRE en vertu des présentes n'ont que le caractère d'obligation de moyens, étant en outre entendu que la Société PRESTATAIRE ne pourra en aucun cas être tenue pour responsable de la mauvaise utilisation ou de la non-utilisation par la Société BENEFICIAIRE des conseils et recommandations qu'elle sera amenée à donner en vertu des présentes ou des services qu'elle sera amenée à rendre.\n\n1.2 Les délais de réalisation des prestations indiqués par le PRESTATAIRE sont donnés à titre indicatif. Les dépassements de ces délais ne peuvent être sanctionnés par des dommages et intérêts, indemnités, retenues ou annulation de commande. De plus, ces délais sont subordonnés à la réception en temps utile par la Société PRESTATAIRE de tous les renseignements à fournir par le Client.\n\n1.3 La Société PRESTATAIRE s'engage à affecter à l'exécution des présentes un interlocuteur compétent et spécialisé. Elle pourra également faire appel à des consultants extérieurs ou sous-traiter, sans toutefois qu'il en résulte une quelconque atténuation de sa responsabilité à l'égard de la Société BENEFICIAIRE.\n\n1.4 La Société PRESTATAIRE décidera seule du choix du personnel salarié ou non devant être affecté aux missions dont elle a la charge. Ledit personnel ne pourra recevoir aucune directive de la part de la Société BENEFICIAIRE et restera, en toute hypothèse, sous la responsabilité hiérarchique entière et exclusive de la Société PRESTATAIRE."
        ),
        textEl("p3-art4", 40, 420, 570, 15, "IV - OBLIGATIONS DU BENEFICIAIRE", { bold: true }),
        textEl(
          "p3-art4-body",
          40,
          445,
          570,
          90,
          "1.1 La Société BENEFICIAIRE s'engage expressément à fournir, pendant toute la durée du présent contrat, au PRESTATAIRE, toutes les informations, tous les renseignements, tous les documents et toute l'assistance raisonnablement nécessaires pour lui permettre de réaliser l'objet du contrat et d'assurer, dans de bonnes conditions, la fourniture desdites prestations."
        ),
        textEl("p3-art5", 40, 550, 570, 15, "V - RESPONSABILITE PRESTATAIRE", { bold: true }),
        textEl(
          "p3-art5-body",
          40,
          575,
          570,
          300,
          "1.1 La Société PRESTATAIRE ne sera responsable que des dommages directs qu'elle pourrait causer au BENEFICIAIRE dans l'exécution des prestations de services. Elle ne pourra être tenue responsable des préjudices indirects — tels que préjudice commercial, perte de clientèle, perte de commande, perte de chiffre d'affaires, perte de bénéfice ou encore manque à gagner — subis par le BENEFICIAIRE. En tout état de cause, l'indemnité totale due par le PRESTATAIRE au BENEFICIAIRE en réparation de son préjudice au titre de la réalisation de la prestation de service ne pourra jamais excéder le montant total qui sera payé au PRESTATAIRE par le BENEFICIAIRE dans le cadre de la réalisation de la prestation de service.\n\n1.2 La société BENEFICIAIRE doit s'assurer avant toute intervention du PRESTATAIRE qu'une sauvegarde complète des applications et des données a été préalablement réalisée. En aucun cas le PRESTATAIRE ne pourra être tenu responsable de la perte de données, et ce sans que ne puissent être remis en cause les termes du présent contrat."
        ),
      ],
      dynamicZones: [],
      staticElements: [],
    },
    {
      pageNumber: 7,
      title: "Art. VI à IX",
      type: "static",
      documentScope: "contrat",
      elements: [
        textEl("p4-art5", 40, 50, 570, 15, "VI - FACTURATION", { bold: true }),
        textEl(
          "p4-art5-body",
          40,
          75,
          570,
          320,
          "1.1 La rémunération des prestations définies dans le contrat d'application fera l'objet d'une redevance dont le montant et la périodicité sont précisés dans le contrat d'application annexé aux présentes. Les prestations ponctuelles hors abonnement seront facturées à l'acte ou selon un relevé périodique.\n\nLes Prestations seront facturées dès la signature du contrat d'application par le client. A défaut de paiement de la somme due, LE PRESTATAIRE se réserve le droit de suspendre l'exécution des prestations, 10 jours après mise en demeure de règlement demeurée infructueuse.\n\nLe BENEFICIAIRE accepte toute information par voie électronique, toute notification écrite sous forme simple ou recommandée, ainsi que la fourniture (expédition ou mise à disposition) de toute pièce de facturation sous format électronique.\n\n1.2 En cas de retard de paiement des sommes dues par le Client au-delà du délai ci-dessus fixé, des pénalités de retard seront calculées en appliquant un taux de un et demi (1,5) fois le taux d'intérêt légal en vigueur en France au montant TTC du prix mentionné sur la facture. En outre, tout montant non réglé à l'échéance donnera lieu au paiement par le Client d'une indemnité forfaitaire pour frais de recouvrement d'un montant de quarante (40) Euros. Si les frais de recouvrement engagés par LE PRESTATAIRE sont supérieurs à ce montant forfaitaire, une indemnisation complémentaire sur justification pourra être demandée.\n\nLe retard de paiement entraînera également l'exigibilité immédiate de l'intégralité des sommes dues par le BENEFICIAIRE, sans préjudice de toute autre action que LE PRESTATAIRE serait en droit d'intenter, à ce titre, à l'encontre du BENEFICIAIRE."
        ),
        textEl("p4-art6", 40, 420, 570, 15, "VII - DUREE", { bold: true }),
        textEl(
          "p4-art6-body",
          40,
          445,
          570,
          180,
          "Le présent contrat cadre est conclu pour une durée indéterminée.\n\nIl pourra être rompu par l'une ou l'autre des Parties, à sa date anniversaire, par l'envoi d'une lettre recommandée avec avis de réception à l'autre Partie en respectant un préavis de 3 mois.\n\nEn revanche, le contrat d'application est conclu pour une durée ferme, déterminée par décision du BÉNÉFICIAIRE et conformément à l'offre associée. À son terme, il pourra être renouvelé au moyen de la signature d'un nouveau contrat d'application. A défaut de signature, le contrat d'application sera prorogé jusqu'à signature d'un nouveau contrat d'application ou notification par le Bénéficiaire, par courrier recommandé, de son désir de résilier le contrat d'application après son terme."
        ),
        textEl("p4-art7", 40, 640, 570, 15, "VIII - RESOLUTION DU CONTRAT", { bold: true }),
        textEl(
          "p4-art7-body",
          40,
          665,
          570,
          170,
          "En cas de non-respect par l'une ou l'autre des parties des obligations suivantes :\n- Défaut de paiement de la facturation par le BENEFICIAIRE,\n- Défaillance d'une des Parties dans le respect des obligations visées aux articles du présent contrat,\ncelui-ci pourra être résolu au gré de la partie lésée.\n\nIl est expressément entendu que cette résolution pour manquement d'une partie à ses obligations aura lieu de plein droit TRENTE (30) jours après envoi d'une mise en demeure de s'exécuter, restée, en tout ou partie, sans effet. La mise en demeure pourra être notifiée par lettre recommandée avec demande d'avis de réception ou tout acte extrajudiciaire.\n\nCette mise en demeure devra mentionner l'intention d'appliquer la présente clause."
        ),
        textEl("p4-art8", 40, 850, 570, 15, "IX - OBLIGATIONS DE DISCRETION - CONFIDENTIALITE", { bold: true }),
        textEl(
          "p4-art8-body",
          40,
          875,
          570,
          260,
          "Les parties ci-dessus désignées s'engagent à considérer comme strictement confidentiels l'ensemble des documents, informations, résultats ou données, d'ordre technique, scientifique, commercial, financier ou autre, qui leur ont été et/ou qui leur seront communiqués dans le cadre du présent contrat, ou dont elles pourraient avoir connaissance à l'occasion de l'exécution des présentes.\n\nLes parties s'engagent pendant toute la durée du présent contrat et sans limitation de durée après l'expiration de celui-ci, pour quelque cause que ce soit, à la confidentialité la plus totale, en s'interdisant de divulguer, directement ou indirectement, quelques informations, connaissances ou savoir-faire que ce soient concernant son co-contractant et ses modalités de fonctionnement, auxquels il aurait pu avoir accès dans le cadre de l'exécution du présent contrat, à moins que lesdites informations, connaissances ou savoir-faire ne soient tombés dans le domaine public.\n\nLes parties soussignées s'engagent, en conséquence, tant pour leur compte que pour celui de leurs salariés, préposés et conseils, dont elles se portent fort, à ne pas divulguer lesdits documents et informations, à quelque personne et sous quelque forme que ce soit, et à ne pas les exploiter à des fins personnelles et en dehors de l'exécution du présent accord, sauf avec l'autorisation expresse, préalable et écrite de l'autre partie ou sur injonction de justice ou d'une autorité administrative ou de contrôle.\n\nElles s'engagent à ne communiquer et révéler ces informations qu'aux seuls membres de leurs équipes qui ont besoin de les utiliser dans le cadre de l'exécution du présent accord et à assurer la sécurité physique de ces informations confidentielles, par tous moyens appropriés."
        ),
      ],
      dynamicZones: [],
      staticElements: [],
    },
    {
      pageNumber: 8,
      title: "Art. X à XIII",
      type: "static",
      documentScope: "contrat",
      elements: [
        textEl("p5-art9", 40, 50, 570, 15, "X - CLAUSES DU CONTRAT", { bold: true }),
        textEl(
          "p5-art9-body",
          40,
          75,
          570,
          60,
          "Les parties conviennent expressément qu'aucune des clauses du contrat ne pourra être réputée comminatoire ou de style, mais qu'elles doivent toutes recevoir leur pleine et entière exécution, sans quoi le présent Contrat n'eût pas été conclu."
        ),
        textEl("p5-art10", 40, 150, 570, 15, "XI - INDEPENDANCE DES CLAUSES", { bold: true }),
        textEl(
          "p5-art10-body",
          40,
          175,
          570,
          140,
          "Toute disposition du présent contrat qui serait ou deviendrait illégale ou qui ne pourrait être exécutée aux termes du droit applicable sera entièrement indépendante ; les autres dispositions du présent Contrat n'en seront pas affectées et produiront leurs effets.\n\nLadite disposition sera automatiquement remplacée par une nouvelle disposition légale, valable, pouvant être exécutée et dont les termes et effets pour les parties sont aussi semblables que possible.\n\nSi ladite disposition n'est pas automatiquement remplacée, les parties négocieront de bonne foi pour convenir d'une disposition de remplacement."
        ),
        textEl("p5-art11", 40, 340, 570, 15, "XII - INDEPENDANCE DES PARTIES", { bold: true }),
        textEl(
          "p5-art11-body",
          40,
          365,
          570,
          320,
          "Les parties déclarent expressément qu'elles sont et demeureront, pendant toute la durée du présent contrat, des partenaires commerciaux et professionnels indépendants, assumant chacun les risques et conséquences de leur propre exploitation.\n\nChacune des parties conserve à tout moment la responsabilité et la maîtrise de ses fonctions de gestion commerciale, gestion financière, gestion de la production et gestion des ressources humaines, la Société PRESTATAIRE n'intervenant que pour effectuer des recommandations sur le choix et la manière de mettre en œuvre les méthodes et techniques de direction et de gestion les plus adaptées.\n\nEn conséquence, aucun lien de subordination ne saurait être recherché dans le présent Contrat de services.\n\nDe même, chacun des co-contractants dirigera seul son personnel et conservera la garde pleine et entière de son propre matériel. Assurant de manière totalement indépendante les tâches qui lui sont confiées, la Société PRESTATAIRE sera seule responsable de ses préposés et de son matériel.\n\nA cet égard, la Société PRESTATAIRE garantit à la Société BENEFICIAIRE qu'elle est à jour du règlement de l'assurance qui couvre sa responsabilité civile et tout accident qui surviendrait du fait de ses préposés ou de son matériel et qu'elle le demeurera à tout moment de l'exécution des présentes. La Société PRESTATAIRE s'engage à justifier desdites assurances à première demande de la Société BENEFICIAIRE.\n\nLa Société PRESTATAIRE déclare en outre que son personnel est régulièrement inscrit comme salarié auprès des organismes de sécurité sociale compétents et que ce personnel bénéficie en conséquence d'une protection sociale complète et conforme à l'ensemble des dispositions contractuelles applicables."
        ),
        textEl("p5-art12", 40, 710, 570, 15, "XIII - ELECTION DE DOMICILE - ATTRIBUTION DE JURIDICTION - CONVENTION DE PREUVE", { bold: true }),
        textEl(
          "p5-art12-body",
          40,
          745,
          570,
          220,
          "Pour l'exécution des présentes, les parties font élection de domicile en leur siège respectif, tel que sus-indiqué. Pour tous litiges et contestations relatifs à l'exécution ou à l'interprétation du présent Contrat, les parties attribuent expressément compétence aux juridictions de BORDEAUX.\n\nEn outre, le BENEFICIAIRE accepte qu'en cas de litige :\n1. Les éléments d'identification, les certificats de signature électronique et les signatures électroniques soient admissibles devant les tribunaux et fassent preuve des données, des consentements et des faits qu'ils contiennent ainsi que des signatures qu'ils expriment ;\n2. Les marques de temps soient admissibles devant les tribunaux et fassent preuve des données et des faits qu'elles contiennent ;\n3. Les documents échangés sous forme électronique soient admissibles devant les tribunaux et fassent preuve des données et des faits qu'ils contiennent ;\n4. La signature électronique apposée sur un document ait même effet juridique qu'une signature manuscrite."
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
