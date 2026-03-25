export type CommercialEntity = 'cybertek-pro' | 'grosbill-pro';

export interface Commercial {
  id: string;
  entity: CommercialEntity;
  nom: string;
  telephone: string | null;
  email: string;
  adresse: string;
}

export const ENTITIES: { id: CommercialEntity; label: string }[] = [
  { id: 'cybertek-pro', label: 'Cybertek Pro' },
  { id: 'grosbill-pro', label: 'Grosbill Pro' },
];

export const COMMERCIAUX: Commercial[] = [
  // Cybertek Pro
  { 
    id: 'vb-cybertek', 
    entity: 'cybertek-pro', 
    nom: 'Victor Bordaraud', 
    telephone: '06 08 35 94 75', 
    email: 'v.bordaraud@cybertek-pro.fr',
    adresse: '130, rue Achard - Bât. U, 33300 Bordeaux – France' 
  },
  { 
    id: 'gm-cybertek', 
    entity: 'cybertek-pro', 
    nom: 'Grégory Moinet', 
    telephone: '07 43 15 32 11', 
    email: 'g.moinet@cybertek-pro.fr', 
    adresse: '130, rue Achard - Bât. U, 33300 Bordeaux – France' 
  },
  { 
    id: 'jw-cybertek', 
    entity: 'cybertek-pro', 
    nom: 'Johanna Weill', 
    telephone: '05 56 11 88 99', 
    email: 'j.weill@cybertek-pro.fr', 
    adresse: '130, rue Achard - Bât. U, 33300 Bordeaux – France' 
  },
  { 
    id: 'mh-cybertek', 
    entity: 'cybertek-pro', 
    nom: 'Mathis Houdbert', 
    telephone: null, 
    email: 'm.houdbert@cybertek-pro.fr', 
    adresse: '130, rue Achard - Bât. U, 33300 Bordeaux – France' 
  },
  { 
    id: 'aa-cybertek', 
    entity: 'cybertek-pro', 
    nom: 'Adil Aboutaib', 
    telephone: null, 
    email: 'a.aboutaib@cybertek-pro.fr', 
    adresse: '130, rue Achard - Bât. U, 33300 Bordeaux – France' 
  },
  { 
    id: 'cb-cybertek', 
    entity: 'cybertek-pro', 
    nom: 'Christophe Besse', 
    telephone: '05 40 32 02 24', 
    email: 'c.besse@picata.fr', 
    adresse: '130, rue Achard - Bât. U, 33300 Bordeaux – France' 
  },
  // Grosbill Pro
  { 
    id: 'mk-grosbill', 
    entity: 'grosbill-pro', 
    nom: 'Mehdi Kharsou', 
    telephone: '01 84 25 92 72', 
    email: 'm.kharsou@grosbill-pro.com', 
    adresse: '60 Boulevard de l\'hôpital, 75013 Paris' 
  },
  { 
    id: 'gm-grosbill', 
    entity: 'grosbill-pro', 
    nom: 'Grégory Moinet', 
    telephone: '07 43 15 32 11', 
    email: 'location@grosbill-pro.com', 
    adresse: '60 Boulevard de l\'hôpital, 75013 Paris' 
  },
  { 
    id: 'mk2-grosbill', 
    entity: 'grosbill-pro', 
    nom: 'Malek Kaderi', 
    telephone: '07 69 55 12 86', 
    email: 'm.kaderi@grosbill-pro.com', 
    adresse: '60 Boulevard de l\'hôpital, 75013 Paris' 
  },
  { 
    id: 'jb-grosbill', 
    entity: 'grosbill-pro', 
    nom: 'Jonathan Breton', 
    telephone: '01 84 25 92 72', 
    email: 'j.breton@grosbill-pro.com', 
    adresse: '60 Boulevard de l\'hôpital, 75013 Paris' 
  },
];

export const getCommerciauxByEntity = (entity: CommercialEntity): Commercial[] => 
  COMMERCIAUX.filter(c => c.entity === entity);

export const getCommercialById = (id: string): Commercial | null =>
  COMMERCIAUX.find(c => c.id === id) ?? null;
