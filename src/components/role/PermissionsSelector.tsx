"use client";
import { useGetFeaturesQuery } from "@/lib/services/roleApi";
import type { Feature, Page, Action } from "@/types/role";

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
  const { data: features, isLoading } = useGetFeaturesQuery();
  const allFeatures: Feature[] = features || [];

  // Derive pages from selected features
  const visiblePages: Page[] = [];
  allFeatures.forEach((f) => {
    if (selectedFeatures.includes(f.id) && f.pages) {
      visiblePages.push(...f.pages);
    }
  });

  // Derive actions from selected pages
  const visibleActions: Action[] = [];
  const actionsByPage: Record<string, Action[]> = {};
  visiblePages.forEach((p) => {
    if (selectedPages.includes(p.id) && p.actions) {
      actionsByPage[p.name] = p.actions;
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
      // Sélectionner toutes les features
      onFeaturesChange(allFeatureIds);
      
      // Auto-sélectionner toutes les pages de toutes les features
      const allPageIdsFromFeatures = allFeatures.flatMap((f) => f.pages?.map((p) => p.id) ?? []);
      onPagesChange(allPageIdsFromFeatures);
      
      // Auto-sélectionner TOUTES les actions de toutes les pages
      const allActionIdsFromFeatures = allFeatures.flatMap((f) => 
        f.pages?.flatMap((p) => 
          p.actions?.map((a) => a.id) ?? []
        ) ?? []
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
      // Auto-select READ actions for all pages
      const readIds = visiblePages.flatMap((p) => p.actions?.filter((a) => isReadAction(a.code)).map((a) => a.id) ?? []);
      const merged = Array.from(new Set([...selectedActions, ...readIds]));
      onActionsChange(merged);
    }
  };

  const handleSelectAllActions = () => {
    if (allActionsSelected) {
      // Keep only read actions (can't deselect them)
      const readIds = visibleActions.filter((a) => isReadAction(a.code)).map((a) => a.id);
      onActionsChange(readIds);
    } else {
      const merged = Array.from(new Set([...selectedActions, ...allActionIds]));
      onActionsChange(merged);
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
      // Sélectionner la feature
      onFeaturesChange([...selectedFeatures, featureId]);
      
      // Auto-sélectionner toutes les pages de cette feature
      const feature = allFeatures.find((f) => f.id === featureId);
      const pageIds = feature?.pages?.map((p) => p.id) ?? [];
      const newPages = Array.from(new Set([...selectedPages, ...pageIds]));
      onPagesChange(newPages);
      
      // Auto-sélectionner toutes les actions READ de ces pages
      const readActionIds = feature?.pages?.flatMap((p) => 
        p.actions?.filter((a) => isReadAction(a.code)).map((a) => a.id) ?? []
      ) ?? [];
      const newActions = Array.from(new Set([...selectedActions, ...readActionIds]));
      onActionsChange(newActions);
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

  // Select all per feature (pages + actions)
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

  const colClass = "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col";
  const headerClass = "bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between";
  const checkboxClass = "h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500";
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

      <div className="grid grid-cols-3 gap-4 h-[460px]">
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
                  const featureAllPages = featurePageIds.length > 0 && featurePageIds.every((id) => selectedPages.includes(id));
                  return (
                    <li key={feature.id}>
                      <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature.id)}
                            onChange={() => handleFeatureToggle(feature.id)}
                            className={checkboxClass}
                          />
                          <div>
                            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{feature.name}</p>
                            {feature.description && (
                              <p className="text-xs text-gray-400">{feature.description}</p>
                            )}
                          </div>
                        </label>
                        {selectedFeatures.includes(feature.id) && (
                          <button
                            type="button"
                            onClick={() => handleSelectFeatureAll(feature)}
                            className={`${selectAllBtn} shrink-0`}
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
                {visiblePages.map((page) => (
                  <li key={page.id}>
                    <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <input
                        type="checkbox"
                        checked={selectedPages.includes(page.id)}
                        onChange={() => handlePageToggle(page.id)}
                        className={checkboxClass}
                      />
                      <div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{page.name}</p>
                        {page.path && <p className="text-xs text-gray-400">{page.path}</p>}
                      </div>
                    </label>
                  </li>
                ))}
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
                {Object.entries(actionsByPage).map(([pageName, actions]) => (
                  <div key={pageName}>
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{pageName}</p>
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                      {actions.map((action) => {
                        const isRead = isReadAction(action.code);
                        return (
                          <li key={action.id}>
                            <label
                              className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                                isRead ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedActions.includes(action.id)}
                                onChange={() => handleActionToggle(action.id)}
                                disabled={isRead && selectedActions.includes(action.id)}
                                className={checkboxClass}
                              />
                              <div>
                                <p className="text-sm text-gray-800 dark:text-gray-200">{action.name}</p>
                                <p className="text-xs text-gray-400">{action.code}</p>
                                {isRead && (
                                  <p className="text-xs text-amber-500">Requis</p>
                                )}
                              </div>
                            </label>
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
