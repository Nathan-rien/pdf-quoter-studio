import type { PDFTemplate, TemplateVersion } from '@/types/template-editor';

type GetPublishedVersion = (templateId: string) => TemplateVersion | null;

const CONTRAT_CADRE_SERVICES_NAME = 'contrat cadre services';

export function isServiceTemplateCandidate(template: PDFTemplate): boolean {
  return (
    template.targetView === 'services' ||
    template.name.trim().toLowerCase() === CONTRAT_CADRE_SERVICES_NAME
  );
}

function versionTimestamp(version: TemplateVersion | null): number {
  if (!version) return 0;
  return version.publishedAt ? new Date(version.publishedAt).getTime() : version.versionNumber;
}

export function getPublishedServiceTemplates(
  allTemplates: PDFTemplate[],
  getTemplatePublishedVersion: GetPublishedVersion,
): PDFTemplate[] {
  return allTemplates
    .filter((template) => isServiceTemplateCandidate(template) && !!getTemplatePublishedVersion(template.id))
    .sort((a, b) => {
      const aIsCadre = a.name.trim().toLowerCase() === CONTRAT_CADRE_SERVICES_NAME;
      const bIsCadre = b.name.trim().toLowerCase() === CONTRAT_CADRE_SERVICES_NAME;
      if (aIsCadre !== bIsCadre) return aIsCadre ? -1 : 1;

      const aVersion = getTemplatePublishedVersion(a.id);
      const bVersion = getTemplatePublishedVersion(b.id);
      if ((aVersion?.versionNumber ?? 0) !== (bVersion?.versionNumber ?? 0)) {
        return (bVersion?.versionNumber ?? 0) - (aVersion?.versionNumber ?? 0);
      }
      return versionTimestamp(bVersion) - versionTimestamp(aVersion);
    });
}

export function resolveServiceTemplate(params: {
  selectedTemplateIds?: Array<string | null | undefined>;
  allTemplates: PDFTemplate[];
  getTemplatePublishedVersion: GetPublishedVersion;
}): PDFTemplate | null {
  const { selectedTemplateIds = [], allTemplates, getTemplatePublishedVersion } = params;

  for (const id of selectedTemplateIds) {
    if (!id) continue;
    const selected = allTemplates.find((template) => template.id === id);
    if (selected && isServiceTemplateCandidate(selected) && getTemplatePublishedVersion(selected.id)) {
      return selected;
    }
  }

  const serviceTemplates = getPublishedServiceTemplates(allTemplates, getTemplatePublishedVersion);
  return serviceTemplates.find((template) => template.isActive) ?? serviceTemplates[0] ?? null;
}