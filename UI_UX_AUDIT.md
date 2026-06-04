# RAPPORT D'AUDIT UI/UX ERP AKPBF

Ce document présente l'audit complet de l'interface utilisateur et de l'expérience de l'ERP AKPBF, conformément aux standards du design d'applications professionnelles (comme Odoo Enterprise, Stripe Dashboard, Linear, Notion et Fluent Design).

---

## 📌 1. PROBLÈMES VISUELS ET D'EXPÉRIENCE IDENTIFIÉS

### A. Alinement d'Éléments & Grid layouts
*   **Alignement Vertical des Icones & Saisie :** Les conteneurs de formulaire, champs textuels et boutons d'icône souffrent de mauvaises déclarations `align-items` et `justify-content`, provoquant un décalage vertical et rendant le champ asymétrique.
*   **Grilles Bento et Cartes Inégales :** Des cartes affichent des hauteurs inégales dans le tableau de bord parce que les conteneurs flex ne sont pas étirés de manière homogène (`h-full` absent ou `grid-rows` asymétriques).

### B. Typographie et Hiérarchie Visuelle (Contraste suffisant)
*   **Tailles de polices trop réduites :** Les boutons principaux présentaient des polices de `12px` - `14px`, rendant l'interface déséquilibrée sur des moniteurs modernes de bureau et difficile à presser sur écran mobile tactile.
*   **Titres de Page plats :** Manque d'espaces négatifs marqués et de gras sélectif sur les titres d'onglets (Space Grotesk / Inter).

### C. Menu Latéral & État Actif de Navigation
*   La Sidebar possédait un changement de couleur basique sans bordure gauche active, sans ombre portée (`shadow`), sans transition fluide d'état, ni indication d'icône active. L'utilisateur se sentait perdu dans les branches de navigation de l'ERP.

### D. Curseurs et Interactions Tactiles (Design System)
*   **Cibles cliquables muettes :** De nombreuses cartes interactives, boutons d'action de tableau, et icônes d'outils n'avaient pas la propriété CSS `cursor: pointer` déclarée, ni de transitions d'opacité en état d'infobulle.
*   **Hover states inconstants :** Absence d'effets d'élévation (`hover:-translate-y-0.5 shadow-md`) ou de lissage d'état d'activité.

### E. Limites sur Écran Mobile / Tablette (Responsive Design)
*   **Tableaux cassés :** Les tableaux d'abonnés et de factures subissent des débordements horizontaux majeurs sur les smartphones étroits (`320px` - `390px`) à cause de l'absence de conteneurs `overflow-x-auto`.
*   **Modales géantes :** Les boîtes de dialogue et formulaires d'édition débordent de la fenêtre visible sur les écrans tactiles mobiles car les propriétés de dimensions ne sont pas optimisées (`w-full max-w-lg mx-2` non gérées).

---

## 🛠️ 2. PLAN DE MODERNISATION UI/UX (RÈGLES EN COURS DE DÉPLOIEMENT)

### 🎨 Design System Unifié (Inter & JetBrains Mono Accents)
1.  **Champs & Saisie :** Hauteur standard de `48px` avec centrage vertical absolu (`flex items-center`), coins arrondis `rounded-xl`, bordures en dégradation d'opacité `border-slate-200 focus:ring-emerald-500`.
2.  **Typography standard :**
    *   Titre principal : `text-3xl font-bold tracking-tight text-slate-800` (~32px)
    *   Sous-titre : `text-lg font-medium text-slate-500` (~18px)
    *   Boutons & Saisie : `text-base font-semibold` (~16px)
3.  **Active Menu States :** Couleur active de fond contrastée en dégradé, micro-bordure gauche vive `border-l-4 border-emerald-500 opacity-100`, et animation discrète à l'entrée.
4.  **Cursor & Feedback tactile :** Application stricte de `cursor-pointer transition duration-150 ease-in-out` sur toutes les boîtes cliquables.
5.  **Conteneurs Responsives :** Intégration de structures élastiques (`sm:grid-cols-2 lg:grid-cols-4 md:gap-6`), de tableaux escamotables et de menu mobile à tiroir sécurisé.
