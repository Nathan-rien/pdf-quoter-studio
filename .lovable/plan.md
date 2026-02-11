

## Ajouter "Coût locatif annuel" dans le tableau Location

### Contexte
Le champ "Coût locatif annuel" est deja calcule dans chaque scenario (`calculations.coutLocatifAnnuel`). Il faut l'afficher en nouvelle ligne sous "Loyer mensuel HT" dans le tableau de l'apercu et de l'export, conditionne par le toggle `matriceData.showCoutLocatifAnnuel`.

### Modifications

**2 fichiers a modifier :**

1. **`src/components/rental-proposal/RentalProposalPreview.tsx`** (apres ligne 790)
   - Ajouter une ligne conditionnelle apres "Loyer mensuel HT" :
   ```tsx
   {matriceData.showCoutLocatifAnnuel && calculations.coutLocatifAnnuel !== null && (
     <div className="flex justify-between px-3 py-1 text-[10px]">
       <span>Coût locatif annuel</span>
       <span className="font-medium">{calculations.coutLocatifAnnuel.toFixed(2).replace('.', ',')} %</span>
     </div>
   )}
   ```

2. **`src/components/rental-proposal/RentalProposalExport.tsx`** (apres ligne 300)
   - Ajouter une ligne conditionnelle dans le HTML du tableau :
   ```tsx
   ${matriceData.showCoutLocatifAnnuel && calculations.coutLocatifAnnuel !== null ? `
     <tr>
       <td style="padding: 6px 8px;">Coût locatif annuel</td>
       <td style="padding: 6px 8px; text-align: right;">${calculations.coutLocatifAnnuel.toFixed(2).replace('.', ',')} %</td>
     </tr>
   ` : ''}
   ```

### Detail technique
- La valeur est deja calculee via `calculateCoutLocatifAnnuel` dans `rental-calculations.ts`
- L'affichage est conditionne par `matriceData.showCoutLocatifAnnuel` (toggle existant dans Donnees)
- Format : pourcentage avec 2 decimales, separateur virgule (format francais)
