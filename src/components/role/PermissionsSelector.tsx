"use client";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { useGetFeaturesQuery } from "@/lib/services/roleApi";
import type { Feature, Page, Action } from "@/types/role";

// Technical page paths and action code patterns hidden from non-superadmins
const TECHNICAL_PATHS = new Set(["/application-statuses"]);
const TECHNICAL_ACTION_CODES = new Set(["application.delete", "application.create"]);

interface PermissionsSelectorProps {
  selectedFeatures: string[];
  selectedPages: string[];
  selectedActions: string[];
  onFeaturesChange: (ids: string[]) => void;
  onPagesChange: (ids: string[]) => void;
  onActionsChange: (ids: string[]) => void;
}

const isReadAction = (code: string) =>
  code === "READ" || code.toLowerCase().endsWith(".read") || code.toLowerCase() === "read";

export default function PermissionsSelector({
  selectedFeatures,
  selectedPages,
  selectedActions,
  onFeaturesChange,
  onPagesChange,
  onActionsChange,
}: PermissionsSelectorProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin =
    user?.role?.code === "super_admin" ||
    (!user?.company && user?.role?.level != null && (user.role.level as number) >= 999);

  const { data: features, isLoading } = useGetFeaturesQuery();
  const rawFeatures: Feature[] = features || [];

  // Filter internal/technical features and pages for non-superadmins
  const allFeatures: Feature[] = rawFeatures
    .filter((f) => isSuperAdmin || !f.is_internal)
    .map((f) => ({
      ...f,
      pages: f.pages
        ?.filter((p) => isSuperAdmin || !TECHNICAL_PATHS.has(p.path || ""))
        .map((p) => ({
          ...p,
          actions: p.actions?.filter(
            (a) => isSuperAdmin || !TECHNICAL_ACTION_CODES.has(a.code)
          ),
        })),
    }));

  // Derive pages from selected features
  const visiblePages: Page[] = [];
  allFeatures.forEach((f) => {
    if (selectedFeatures.includes(f.id) && f.pages) {
      visiblePages.push(...f.pages);
    }
  });

  // Derive actions from selected pages
  const visibleActions: Action[] = [];
  const actionsByPage: Record<string, { page: Page; actions: Action[] }> = {};
  visiblePages.forEach((p) => {
    if (selectedPages.includes(p.id) && p.actions) {
      actionsByPage[p.id] = { page: p, actions: p.actions };
      visibleActions.push(...p.actions);
    }
  });

  // ── Select-all helpers ──
  const allFeatureIds = allFeatures.map((f) => f.id);
  const allPageIds = visiblePages.map((p) => p.id);
  const allActionIds = visibleActions.map((a) => a.id);

  const allFeaturesSelected = allFeatureIds.length > 0 && allFeatureIds.every((id) => selectedFeatures.includes(id));
  const allPagesSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedPages.includes(id));
  const allActionsSelected = allActionIds.length > 0 && allActionIds.every((id) => selectedActions.includes(id));

  const handleSelectAllFeatures = () => {
    if (allFeaturesSelected) {
      onFeaturesChange([]);
      onPagesChange([]);
      onActionsChange([]);
    } else {
      onFeaturesChange(allFeatureIds);
      const allPageIdsFromFeatures = allFeatures.flatMap((f) => f.pages?.map((p) => p.id) ?? []);
      onPagesChange(allPageIdsFromFeatures);
      const allActionIdsFromFeatures = allFeatures.flatMap((f) =>
        f.pages?.flatMap((p) => p.actions?.map((a) => a.id) ?? []) ?? []
      );
      onActionsChange(allActionIdsFromFeatures);
    }
  };

  const handleSelectAllPages = () => {
    if (allPagesSelected) {
      onPagesChange([]);
      onActionsChange([]);
    } else {
      onPagesChange(allPageIds);
      const readIds = visiblePages.flatMap((p) => p.actions?.filter((a) => isReadAction(a.code)).map((a) => a.id) ?? []);
      onActionsChange(Array.from(new Set([...selectedActions, ...readIds])));
    }
  };

  const handleSelectAllActions = () => {
    if (allActionsSelected) {
      const readIds = visibleActions.filter((a) => isReadAction(a.code)).map((a) => a.id);
      onActionsChange(readIds);
    } else {
      onActionsChange(Array.from(new Set([...selectedActions, ...allActionIds])));
    }
  };

  const handleFeatureToggle = (featureId: string) => {
    const removing = selectedFeatures.includes(featureId);
    if (removing) {
      const feature = allFeatures.find((f) => f.id === featureId);
      const pageIds = feature?.pages?.map((p) => p.id) ?? [];
      const actionIds = feature?.pages?.flatMap((p) => p.actions?.map((a) => a.id) ?? []) ?? [];
      onFeaturesChange(selectedFeatures.filter((id) => id !== featureId));
      onPagesChange(selectedPages.filter((id) => !pageIds.includes(id)));
      onActionsChange(selectedActions.filter((id) => !actionIds.includes(id)));
    } else {
      onFeaturesChange([...selectedFeatures, featureId]);
      const feature = allFeatures.find((f) => f.id === featureId);
      const pageIds = feature?.pages?.map((p) => p.id) ?? [];
      onPagesChange(Array.from(new Set([...selectedPages, ...pageIds])));
      const readActionIds = feature?.pages?.flatMap((p) =>
        p.actions?.filter((a) => isReadAction(a.code)).map((a) => a.id) ?? []
      ) ?? [];
      onActionsChange(Array.from(new Set([...selectedActions, ...readActionIds])));
    }
  };

  const handlePageToggle = (pageId: string) => {
    const removing = selectedPages.includes(pageId);
    if (removing) {
      const page = visiblePages.find((p) => p.id === pageId);
      const actionIds = page?.actions?.map((a) => a.id) ?? [];
      onPagesChange(selectedPages.filter((id) => id !== pageId));
      onActionsChange(selectedActions.filter((id) => !actionIds.includes(id)));
    } else {
      onPagesChange([...selectedPages, pageId]);
      const page = visiblePages.find((p) => p.id === pageId);
      const readAction = page?.actions?.find((a) => isReadAction(a.code));
      if (readAction && !selectedActions.includes(readAction.id)) {
        onActionsChange([...selectedActions, readAction.id]);
      }
    }
  };

  const handleActionToggle = (actionId: string) => {
    const action = visibleActions.find((a) => a.id === actionId);
    if (action && isReadAction(action.code) && selectedActions.includes(actionId)) return;
    const removing = selectedActions.includes(actionId);
    onActionsChange(
      removing ? selectedActions.filter((id) => id !== actionId) : [...selectedActions, actionId]
    );
  };

  const handleSelectFeatureAll = (feature: Feature) => {
    const pageIds = feature.pages?.map((p) => p.id) ?? [];
    const actionIds = feature.pages?.flatMap((p) => p.actions?.map((a) => a.id) ?? []) ?? [];
    const allSelected = pageIds.every((id) => selectedPages.includes(id));
    if (allSelected) {
      onPagesChange(selectedPages.filter((id) => !pageIds.includes(id)));
      onActionsChange(selectedActions.filter((id) => !actionIds.includes(id)));
    } else {
      onPagesChange(Array.from(new Set([...selectedPages, ...pageIds])));
      onActionsChange(Array.from(new Set([...selectedActions, ...actionIds])));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Humanize action code suffix → French label
  const humanizeAction = (name: string, code: string): string => {
    if (name && name.toLowerCase() !== code.toLowerCase()) return name;
    const suffix = code.split(".").pop()?.toLowerCase() ?? code;
    const map: Record<string, string> = {
      read: "Consulter", create: "Créer", update: "Modifier",
      delete: "Supprimer", export: "Exporter", import: "Importer",
      approve: "Approuver", reject: "Rejeter", archive: "Archiver",
      send: "Envoyer", assign: "Assigner", manage: "Gérer",
      resend: "Renvoyer", stats: "Statistiques", "update-status": "Changer le statut",
    };
    return map[suffix] ?? name;
  };

  const colClass = "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col";
  const headerClass = "bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between";
  const checkboxClass = "h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 shrink-0 mt-0.5";
  const selectAllBtn = "text-xs text-brand-600 hover:text-brand-800 font-medium px-1";

  return (
    <div className="space-y-2">
      {/* Global select-all bar */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-xs text-gray-500 font-medium">Sélection globale :</span>
        <button type="button" onClick={handleSelectAllFeatures} className={selectAllBtn}>
          {allFeaturesSelected ? "Tout désélectionner" : "Tout sélectionner"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 h-[500px]">

        {/* ── Modules column ── */}
        <div className={colClass}>
          <div className={headerClass}>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Modules
              <span className="ml-2 text-xs text-gray-400">({selectedFeatures.length}/{allFeatures.length})</span>
            </h4>
            <button type="button" onClick={handleSelectAllFeatures} className={selectAllBtn}>
              {allFeaturesSelected ? "Aucun" : "Tous"}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {allFeatures.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">Aucun module</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {allFeatures.map((feature) => {
                  const featurePageIds = feature.pages?.map((p) => p.id) ?? [];
                  const featureAllPages =
                    featurePageIds.length > 0 &&
                    featurePageIds.every((id) => selectedPages.includes(id));
                  const isSelected = selectedFeatures.includes(feature.id);
                  return (
                    <li key={feature.id}>
                      <div
                        title={feature.description ? `${feature.name} — ${feature.description}` : feature.name}
                        className={`flex items-start gap-2 px-3 py-2.5 transition-colors ${
                          isSelected
                            ? "bg-brand-50 dark:bg-brand-500/10"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleFeatureToggle(feature.id)}
                          className={checkboxClass}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-tight">
                            {feature.name}
                          </p>
                          {feature.description && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                              {feature.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={() => handleSelectFeatureAll(feature)}
                            className={`${selectAllBtn} shrink-0 mt-0.5`}
                            title={featureAllPages ? "Retirer toutes les pages" : "Sélectionner toutes les pages"}
                          >
                            {featureAllPages ? "−" : "+"}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Pages column ── */}
        <div className={colClass}>
          <div className={headerClass}>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pages
              <span className="ml-2 text-xs text-gray-400">({selectedPages.length}/{visiblePages.length})</span>
            </h4>
            {visiblePages.length > 0 && (
              <button type="button" onClick={handleSelectAllPages} className={selectAllBtn}>
                {allPagesSelected ? "Aucune" : "Toutes"}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {selectedFeatures.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">Sélectionnez un module</p>
            ) : visiblePages.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">Aucune page disponible</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {visiblePages.map((page) => {
                  const isSelected = selectedPages.includes(page.id);
                  return (
                    <li key={page.id}>
                      <div
                        title={page.description ? `${page.name} — ${page.description}` : page.name}
                        className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-brand-50 dark:bg-brand-500/10"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                        onClick={() => handlePageToggle(page.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handlePageToggle(page.id)}
                          onClick={(e) => e.stopPropagation()}
                          className={checkboxClass}
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-tight">
                            {page.name}
                          </p>
                          {page.description && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                              {page.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Actions column ── */}
        <div className={colClass}>
          <div className={headerClass}>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Actions
              <span className="ml-2 text-xs text-gray-400">({selectedActions.length}/{visibleActions.length})</span>
            </h4>
            {visibleActions.length > 0 && (
              <button type="button" onClick={handleSelectAllActions} className={selectAllBtn}>
                {allActionsSelected ? "Minimum" : "Toutes"}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {selectedPages.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">Sélectionnez une page</p>
            ) : visibleActions.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">Aucune action</p>
            ) : (
              <div>
                {Object.values(actionsByPage).map(({ page, actions }) => (
                  <div key={page.id}>
                    {/* Page sub-header inside actions column */}
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{page.name}</p>
                      {page.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                          {page.description}
                        </p>
                      )}
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                      {actions.map((action) => {
                        const isRead = isReadAction(action.code);
                        const isSelected = selectedActions.includes(action.id);
                        return (
                          <li key={action.id}>
                            <div
                              title={action.description
                                ? `${humanizeAction(action.name, action.code)} — ${action.description}`
                                : humanizeAction(action.name, action.code)}
                              className={`flex items-start gap-2.5 px-3 py-2 transition-colors ${
                                isRead
                                  ? "cursor-not-allowed"
                                  : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              } ${
                                isSelected && !isRead
                                  ? "bg-brand-50 dark:bg-brand-500/10"
                                  : ""
                              }`}
                              onClick={() => !isRead && handleActionToggle(action.id)}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleActionToggle(action.id)}
                                onClick={(e) => e.stopPropagation()}
                                disabled={isRead && isSelected}
                                className={`${checkboxClass} ${isRead ? "opacity-60" : ""}`}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-tight">
                                    {humanizeAction(action.name, action.code)}
                                  </p>
                                  {isRead && (
                                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">
                                      Obligatoire
                                    </span>
                                  )}
                                </div>
                                {action.description && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                                    {action.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
